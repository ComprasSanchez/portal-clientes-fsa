import { mapAuthError } from "@/lib/authErrors";
import { LoginResponse } from "@/types/login";

export const getErrorMessage = (
  payload: LoginResponse | null,
  fallback: string,
) => {
  if (
    payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "code" in payload.error
  ) {
    const error = payload.error as {
      code?: string;
      details?: {
        remainingAttempts?: number;
        retryAfterSec?: number;
      };
    };

    const mappedMessage = mapAuthError(error.code ?? "AUTH_UNKNOWN");
    const remainingAttempts = error.details?.remainingAttempts;
    const retryAfterSec = error.details?.retryAfterSec;

    if (
      (error.code === "AUTH_MFA_INVALID_CODE" ||
        error.code === "AUTH_MFA_CODE_INVALID" ||
        error.code === "AUTH_RESET_INVALID_CODE") &&
      typeof remainingAttempts === "number"
    ) {
      return `${mappedMessage} Te quedan ${remainingAttempts} intento${remainingAttempts === 1 ? "" : "s"}.`;
    }

    if (
      (error.code === "AUTH_EMAIL_VERIFY_RESEND_COOLDOWN" ||
        error.code === "AUTH_RESET_LOCKED") &&
      typeof retryAfterSec === "number"
    ) {
      return `${mappedMessage} Intentá nuevamente en ${retryAfterSec} segundo${retryAfterSec === 1 ? "" : "s"}.`;
    }

    return mappedMessage;
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
  if (typeof payload?.error === "string" && payload.error === "invalid_body") {
    return "Completá usuario y contraseña para continuar.";
  }
  return fallback;
};
