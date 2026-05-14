import { mapAuthError } from "@/lib/authErrors";
import { LoginResponse } from "@/types/login";

type ErrorDetails = {
  remainingAttempts?: number;
  retryAfterSec?: number;
  reason?: string;
};

type ErrorPayload = {
  code?: string;
  details?: ErrorDetails;
};

const REMAINING_ATTEMPTS_CODES = new Set([
  "AUTH_MFA_INVALID_CODE",
  "AUTH_MFA_CODE_INVALID",
  "AUTH_RESET_INVALID_CODE",
  "AUTH_IDENTITY_LINK_OTP_INVALID",
]);

const RETRY_AFTER_CODES = new Set([
  "AUTH_EMAIL_VERIFY_RESEND_COOLDOWN",
  "AUTH_RESET_LOCKED",
  "AUTH_IDENTITY_LINK_OTP_LOCKED",
]);

const getIdentityLinkConflictMessage = (reason?: string) => {
  switch (reason) {
    case "DOCUMENTO_ALREADY_LINKED":
      return "Este numero de documento ya esta vinculado a otra cuenta. Si creias que no deberia estar vinculado, contacta a soporte.";
    case "EMAIL_ALREADY_USED":
      return "Este email ya esta vinculado a otra cuenta. Usa otro email o contacta a soporte.";
    default:
      return "No pudimos vincular tu cuenta porque el documento o el email ya estan asociados a otra cuenta. Contacta a soporte si necesitas ayuda.";
  }
};

const formatAttemptsMessage = (
  message: string,
  remainingAttempts: number,
) => {
  const suffix = remainingAttempts === 1 ? "" : "s";
  return `${message} Te quedan ${remainingAttempts} intento${suffix}.`;
};

const formatRetryMessage = (message: string, retryAfterSec: number) => {
  const suffix = retryAfterSec === 1 ? "" : "s";
  return `${message} Intentá nuevamente en ${retryAfterSec} segundo${suffix}.`;
};

const isErrorPayload = (error: LoginResponse["error"]): error is ErrorPayload =>
  typeof error === "object" && error !== null;

const getMappedErrorMessage = (error: ErrorPayload) => {
  const code = error.code ?? "AUTH_UNKNOWN";
  const message = mapAuthError(code);
  const remainingAttempts = error.details?.remainingAttempts;
  const retryAfterSec = error.details?.retryAfterSec;
  const reason = error.details?.reason;

  if (code === "AUTH_IDENTITY_LINK_CONFLICT") {
    return getIdentityLinkConflictMessage(reason);
  }

  if (
    REMAINING_ATTEMPTS_CODES.has(code) &&
    typeof remainingAttempts === "number"
  ) {
    return formatAttemptsMessage(message, remainingAttempts);
  }

  if (RETRY_AFTER_CODES.has(code) && typeof retryAfterSec === "number") {
    return formatRetryMessage(message, retryAfterSec);
  }

  return message;
};

export const getErrorMessage = (
  payload: LoginResponse | null,
  fallback: string,
) => {
  if (payload?.error === "invalid_body") {
    return "Completá usuario y contraseña para continuar.";
  }

  if (isErrorPayload(payload?.error)) {
    return getMappedErrorMessage(payload.error);
  }

  if (typeof payload?.error === "string") {
    return mapAuthError(payload.error);
  }

  if (Array.isArray(payload?.message) && payload.message.length > 0) {
    return payload.message.join(" ");
  }

  if (
    typeof payload?.message === "string" &&
    payload.message.trim().length > 0
  ) {
    return payload.message;
  }

  return fallback;
};
