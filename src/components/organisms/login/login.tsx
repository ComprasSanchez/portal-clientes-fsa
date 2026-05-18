"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useFormik } from "formik";
import { ArrowLeft, Check, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import * as Yup from "yup";
import googleLogo from "@/assets/google-logo.svg";
import mobileLogo from "@/assets/logo-celeste.png";
import loginLogo from "@/assets/farmacia-logo.svg";
import styles from "./login.module.scss";
import { InputMFA, OtpCodeInput } from "@/components/molecules/input-otp/input-otp";
import {
  AuthCardView,
  ForgotPasswordFormValues,
  ForgotPasswordResponse,
  GoogleProfilePrefill,
  GoogleOnboardingFormValues,
  IdentityLinkFormValues,
  LoginFormValues,
  LoginProps,
  LoginResponse,
  MfaState,
  OnboardingFlowState,
  PasswordRecoveryState,
  RegisterFormValues,
  ResetPasswordFormValues,
} from "@/types/login";
import { getErrorMessage } from "@/helpers/error-message";
import { getSafeRedirectPath } from "@/lib/auth";
import { mapAuthError } from "@/lib/authErrors";

const BENEFITS = [
  "Acceso rápido a tus envíos de datos",
  "Reportes y estadísticas en tiempo real",
  "Gestión simplificada de tus entregas",
];

const customerIdentityShape = {
  firstName: Yup.string().trim().required("Ingresá tu nombre."),
  lastName: Yup.string().trim().required("Ingresá tu apellido."),
  documentType: Yup.string().trim().required("Seleccioná un tipo de documento."),
  documentNumber: Yup.string().trim().required("Ingresá tu número de documento."),
  sex: Yup.string().trim().required("Seleccioná tu sexo."),
  birthDate: Yup.string().trim().required("Ingresá tu fecha de nacimiento."),
  phone: Yup.string().trim().required("Ingresá tu teléfono."),
};

const loginValidationSchema = Yup.object({
  username: Yup.string().trim().required("Ingresá tu usuario."),
  password: Yup.string().required("Ingresá tu contraseña."),
});

const registerValidationSchema = Yup.object({
  email: Yup.string().trim().email("Ingresá un email válido.").required("Ingresá un email."),
  password: Yup.string().min(8, "La contraseña debe tener al menos 8 caracteres.").required("Ingresá una contraseña."),
  ...customerIdentityShape,
});

const googleOnboardingValidationSchema = Yup.object(customerIdentityShape);

const identityLinkValidationSchema = Yup.object({
  ...customerIdentityShape,
  email: Yup.string()
    .trim()
    .email("Ingresa un email valido.")
    .required("Ingresa un email."),
});

export const verifyOnboardingValidationSchema = Yup.object({
  token: Yup.string().trim().required("Ingresá el token que recibiste por email."),
});

const identityLinkVerifyValidationSchema = Yup.object({
  code: Yup.string()
    .trim()
    .length(6, "Ingresá el código de 6 dígitos.")
    .required("Ingresá el código de verificación."),
});

const forgotPasswordValidationSchema = Yup.object({
  identifier: Yup.string().trim().email("Ingresá un email válido.").required("Ingresá un email."),
});

const resetPasswordValidationSchema = Yup.object({
  code: Yup.string().trim().length(6, "Ingresá el código de 6 dígitos.").required("Ingresá el código de verificación."),
  newPassword: Yup.string().min(8, "La contraseña debe tener al menos 8 caracteres.").required("Ingresá una nueva contraseña."),
});

const initialRegisterValues: RegisterFormValues = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  documentType: "DNI",
  documentNumber: "",
  sex: "",
  birthDate: "",
  phone: "+549",
};

const initialGoogleOnboardingValues: GoogleOnboardingFormValues = {
  firstName: "",
  lastName: "",
  documentType: "DNI",
  documentNumber: "",
  sex: "",
  birthDate: "",
  phone: "+549",
};

const initialIdentityLinkValues: IdentityLinkFormValues = {
  email: "",
  firstName: "",
  lastName: "",
  documentType: "DNI",
  documentNumber: "",
  sex: "",
  birthDate: "",
  phone: "+549",
};

type IdentityLinkStatusResponse = {
  ok?: boolean;
  link?: {
    linked?: boolean;
    status?: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nombre?: string | null;
    apellido?: string | null;
  };
  profile?: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nombre?: string | null;
    apellido?: string | null;
  };
  account?: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
};

type SocialProfilePayload = Partial<GoogleProfilePrefill> & {
  nombre?: string | null;
  apellido?: string | null;
};

type IdentityLinkResponse = LoginResponse & {
  link?: {
    id?: string;
    linked?: boolean;
    status?: string;
    clienteId?: string | null;
    expiresAt?: number;
    created?: boolean;
  };
};

const getErrorCode = (payload: LoginResponse | null) => {
  if (
    payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "code" in payload.error
  ) {
    return payload.error.code ?? null;
  }

  if (typeof payload?.error === "string") {
    return payload.error;
  }

  return null;
};

const buildCustomerIdentityPayload = (values: GoogleOnboardingFormValues) => ({
  tipoDocumento: values.documentType.trim(),
  nroDocumento: values.documentNumber.trim(),
  nombre: values.firstName.trim(),
  apellido: values.lastName.trim(),
  sexo: values.sex.trim(),
  fechaNacimiento: values.birthDate,
  telefono: values.phone.trim(),
});

const buildIdentityLinkPayload = (values: IdentityLinkFormValues) => ({
  accountKind: "CLIENTE",
  tipoDocumento: values.documentType.trim(),
  nroDocumento: values.documentNumber.trim(),
  nombre: values.firstName.trim(),
  apellido: values.lastName.trim(),
  sexo: values.sex.trim(),
  fechaNacimiento: values.birthDate,
  phoneE164: values.phone.trim(),
  email: values.email.trim(),
});

export function Login({ onLogin }: LoginProps) {
  const MFA_RESEND_COOLDOWN_SECONDS = 50;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cardView, setCardView] = useState<AuthCardView>("login");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [mfaState, setMfaState] = useState<MfaState | null>(null);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [isResendingMfaCode, setIsResendingMfaCode] = useState(false);
  const [mfaResendCooldownSeconds, setMfaResendCooldownSeconds] = useState(0);
  const [mfaInputResetKey, setMfaInputResetKey] = useState(0);
  const [hasProcessedVerificationToken, setHasProcessedVerificationToken] =
    useState(false);
  const [hasProcessedGoogleAuthError, setHasProcessedGoogleAuthError] =
    useState(false);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [passwordRecoveryState, setPasswordRecoveryState] =
    useState<PasswordRecoveryState | null>(null);
  const [isGooglePopupLoading, setIsGooglePopupLoading] = useState(false);
  const [onboardingFlow, setOnboardingFlow] =
    useState<OnboardingFlowState | null>(null);
  const [isResendingOnboarding, setIsResendingOnboarding] = useState(false);
  const [isCompletingGoogleOnboarding, setIsCompletingGoogleOnboarding] =
    useState(false);
  const [isAutoVerifyingOnboarding, setIsAutoVerifyingOnboarding] =
    useState(false);
  const [googleProfilePrefill, setGoogleProfilePrefill] =
    useState<GoogleProfilePrefill | null>(null);
  const [identityLinkFlow, setIdentityLinkFlow] =
    useState<OnboardingFlowState | null>(null);
  const [isStartingIdentityLink, setIsStartingIdentityLink] = useState(false);
  const [isVerifyingIdentityLink, setIsVerifyingIdentityLink] = useState(false);
  const [hasOpenedIdentityLinkFromHint, setHasOpenedIdentityLinkFromHint] =
    useState(false);

  const redirectTo = getSafeRedirectPath(searchParams.get("redirectTo"));
  const identityLinkHint = searchParams.get("identityLink");
  const onboardingHint = searchParams.get("onboarding");
  const onboardingErrorCode = searchParams.get("onboardingError");
  const googleOnboardingHint = searchParams.get("googleOnboarding");
  const verificationTokenFromUrl =
    searchParams.get("token") ||
    searchParams.get("verificationToken") ||
    searchParams.get("onboardingToken");
  const hasGoogleOnboardingHint =
    onboardingHint === "google" ||
    googleOnboardingHint === "pending" ||
    googleOnboardingHint === "1";

  const clearFeedback = () => {
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const syncSearchParams = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      mutator(nextSearchParams);
      const nextQuery = nextSearchParams.toString();
      router.replace(nextQuery ? `/?${nextQuery}` : "/");
    },
    [router, searchParams],
  );

  const openIdentityLinkCard = useCallback(
    (message?: string) => {
      setCardView("identity-link");
      setMfaState(null);
      clearFeedback();
      setIdentityLinkFlow(null);

      if (message) {
        setInfoMessage(message);
      }
    },
    [],
  );

  const openVerifyOnboardingCard = useCallback((message?: string) => {
    setCardView("verify-onboarding");
    setMfaState(null);
    clearFeedback();

    if (message) {
      setInfoMessage(message);
    }
  }, []);

  const normalizeGoogleProfilePrefill = useCallback(
    (payload?: SocialProfilePayload | IdentityLinkStatusResponse | null) => {
      if (!payload) {
        return null;
      }

      const profileLike =
        "profile" in payload || "link" in payload || "account" in payload
          ? {
              email:
                payload.profile?.email ??
                payload.account?.email ??
                payload.link?.email ??
                null,
              firstName:
                payload.profile?.firstName ??
                payload.account?.firstName ??
                payload.link?.firstName ??
                payload.profile?.nombre ??
                payload.link?.nombre ??
                null,
              lastName:
                payload.profile?.lastName ??
                payload.account?.lastName ??
                payload.link?.lastName ??
                payload.profile?.apellido ??
                payload.link?.apellido ??
                null,
            }
          : {
              email: (payload as SocialProfilePayload).email ?? null,
              firstName:
                (payload as SocialProfilePayload).firstName ??
                (payload as SocialProfilePayload).nombre ??
                null,
              lastName:
                (payload as SocialProfilePayload).lastName ??
                (payload as SocialProfilePayload).apellido ??
                null,
            };

      const nextPrefill: GoogleProfilePrefill = {
        email: typeof profileLike.email === "string" ? profileLike.email.trim() : "",
        firstName:
          typeof profileLike.firstName === "string"
            ? profileLike.firstName.trim()
            : "",
        lastName:
          typeof profileLike.lastName === "string"
            ? profileLike.lastName.trim()
            : "",
      };

      return nextPrefill.email || nextPrefill.firstName || nextPrefill.lastName
        ? nextPrefill
        : null;
    },
    [],
  );
  const getIdentityLinkStatus = useCallback(async () => {
    const response = await fetch(
      "/api/v2/auth/identity-link/status?accountKind=CLIENTE",
      {
        cache: "no-store",
        credentials: "include",
      },
    );

    if (response.status === 401) {
      throw new Error("SESSION_MISSING");
    }

    if (response.status === 403) {
      throw new Error("CLIENT_LINK_MISSING");
    }

    if (!response.ok) {
      throw new Error("IDENTITY_STATUS_FAILED");
    }

    return (await response.json()) as IdentityLinkStatusResponse;
  }, []);

  const returnToLogin = () => {
    setCardView("login");
    setMfaState(null);
    setMfaResendCooldownSeconds(0);
    setMfaInputResetKey((currentValue) => currentValue + 1);
    setIdentityLinkFlow(null);
    identityLinkVerifyFormik.resetForm();
    clearFeedback();
  };

  const registerFormik = useFormik<RegisterFormValues>({
    initialValues: initialRegisterValues,
    validationSchema: registerValidationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      clearFeedback();
      setOnboardingFlow(null);
      const derivedUsername = values.email.trim();

      try {
        const { data } = await axios.post<LoginResponse>(
          "/api/v2/auth/onboarding/start",
          {
            account: {
              username: derivedUsername,
              email: values.email.trim(),
              password: values.password,
              firstName: values.firstName.trim(),
              lastName: values.lastName.trim(),
            },
            customerIdentity: buildCustomerIdentityPayload(values),
            accountKind: "CLIENTE",
            externalSystem: "APP",
            externalRef: derivedUsername,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        setOnboardingFlow({
          id: data.flow?.id ?? "",
          status: data.flow?.status,
          expiresAt: data.flow?.expiresAt,
          destinationMasked: data.challenge?.destinationMasked,
          channel: data.challenge?.channel,
        });
        openVerifyOnboardingCard(
          data.challenge?.destinationMasked
            ? `Te enviamos un link de validación a ${data.challenge.destinationMasked}.`
            : "Te enviamos un link de validación por email para completar el onboarding.",
        );
        helpers.resetForm();
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
              "No pudimos iniciar el onboarding. Revisá los datos e intentá nuevamente.",
            ),
          );
        } else {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No pudimos iniciar el onboarding. Intentá nuevamente.",
          );
        }
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const googleOnboardingFormik = useFormik<GoogleOnboardingFormValues>({
    initialValues: initialGoogleOnboardingValues,
    validationSchema: googleOnboardingValidationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      clearFeedback();
      setIsCompletingGoogleOnboarding(true);

      try {
        await axios.post<LoginResponse>(
          "/api/v2/auth/onboarding/google/complete",
          {
            customerIdentity: buildCustomerIdentityPayload(values),
            accountKind: "CLIENTE",
            externalSystem: "APP",
            externalRef: values.documentNumber.trim(),
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        helpers.resetForm();
        setGoogleProfilePrefill(null);
        window.location.assign(redirectTo);
        return;
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
              "No pudimos completar el onboarding con Google. Intentá nuevamente.",
            ),
          );
        } else {
          setErrorMessage(
            "No pudimos completar el onboarding con Google. Intentá nuevamente.",
          );
        }
      } finally {
        setIsCompletingGoogleOnboarding(false);
        helpers.setSubmitting(false);
      }
    },
  });

  const identityLinkFormik = useFormik<IdentityLinkFormValues>({
    initialValues: initialIdentityLinkValues,
    validationSchema: identityLinkValidationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      clearFeedback();
      setIsStartingIdentityLink(true);

      try {
        const { data } = await axios.post<IdentityLinkResponse>(
          "/api/v2/auth/identity-link/start",
          buildIdentityLinkPayload(values),
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const linkId = data.link?.id;

        if (!linkId) {
          throw new Error("IDENTITY_LINK_ID_MISSING");
        }

        const challengeResponse = await axios.post<IdentityLinkResponse>(
          "/api/v2/auth/identity-link/challenge",
          {
            linkId,
            channel: "email",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        setIdentityLinkFlow({
          id: linkId,
          status: challengeResponse.data.link?.status ?? data.link?.status,
          expiresAt:
            challengeResponse.data.link?.expiresAt ?? data.link?.expiresAt,
          destinationMasked:
            challengeResponse.data.challenge?.destinationMasked,
          channel: challengeResponse.data.challenge?.channel ?? "email",
        });
        identityLinkVerifyFormik.resetForm();
        setCardView("identity-link-verify");
        setInfoMessage(
          challengeResponse.data.challenge?.destinationMasked
            ? `Te enviamos un código a ${challengeResponse.data.challenge.destinationMasked}.`
            : "Te enviamos un código para confirmar la vinculación.",
        );
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
              "No pudimos iniciar la vinculación de tu cuenta. Intentá nuevamente.",
            ),
          );
        } else if (
          error instanceof Error &&
          error.message === "IDENTITY_LINK_ID_MISSING"
        ) {
          setErrorMessage(
            "No pudimos iniciar la vinculación porque el backend no devolvió el identificador del flujo.",
          );
        } else {
          setErrorMessage(
            "No pudimos iniciar la vinculación de tu cuenta. Intentá nuevamente.",
          );
        }
      } finally {
        setIsStartingIdentityLink(false);
        helpers.setSubmitting(false);
      }
    },
  });

  const applyGoogleProfilePrefill = useCallback(
    (payload?: SocialProfilePayload | IdentityLinkStatusResponse | null) => {
      const nextPrefill = normalizeGoogleProfilePrefill(payload);

      if (!nextPrefill) {
        return;
      }

      setGoogleProfilePrefill(nextPrefill);
      googleOnboardingFormik.setValues((currentValues) => ({
        ...currentValues,
        firstName: currentValues.firstName || nextPrefill.firstName,
        lastName: currentValues.lastName || nextPrefill.lastName,
      }));
    },
    [googleOnboardingFormik, normalizeGoogleProfilePrefill],
  );

  const applyIdentityLinkPrefill = useCallback(
    (payload?: SocialProfilePayload | IdentityLinkStatusResponse | null) => {
      const nextPrefill = normalizeGoogleProfilePrefill(payload);

      if (!nextPrefill) {
        return;
      }

      identityLinkFormik.setValues((currentValues) => ({
        ...currentValues,
        email: currentValues.email || nextPrefill.email,
        firstName: currentValues.firstName || nextPrefill.firstName,
        lastName: currentValues.lastName || nextPrefill.lastName,
      }));
    },
    [identityLinkFormik, normalizeGoogleProfilePrefill],
  );

  const finishLoginIfIdentityLinked = useCallback(
    async (username: string, password: string) => {
      const identityStatus = await getIdentityLinkStatus();

      if (identityStatus.link?.linked) {
        onLogin?.(username, password);
        router.push(redirectTo);
        router.refresh();
        return true;
      }

      openIdentityLinkCard(
        "Completá tus datos para vincular tu cuenta y poder continuar.",
      );
      applyIdentityLinkPrefill(identityStatus);
      return false;
    },
    [
      applyIdentityLinkPrefill,
      getIdentityLinkStatus,
      onLogin,
      openIdentityLinkCard,
      redirectTo,
      router,
    ],
  );

  const verifyOnboardingFormik = useFormik<{ token: string }>({
    initialValues: {
      token: "",
    },
    validationSchema: undefined,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      clearFeedback();

      try {
        await axios.post<LoginResponse>(
          "/api/v2/auth/onboarding/verify-token",
          {
            token: values.token.trim(),
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        setOnboardingFlow(null);
        helpers.resetForm();
        setCardView("login");
        setInfoMessage(
          "Tu onboarding fue completado correctamente. Ahora podés iniciar sesión.",
        );
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
              "No pudimos validar el token de onboarding. Intentá nuevamente.",
            ),
          );
        } else {
          setErrorMessage(
            "No pudimos validar el token de onboarding. Intentá nuevamente.",
          );
        }
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const identityLinkVerifyFormik = useFormik<{ code: string }>({
    initialValues: {
      code: "",
    },
    validationSchema: identityLinkVerifyValidationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      if (!identityLinkFlow?.id) {
        setErrorMessage(
          "No encontramos una solicitud activa para completar la vinculación.",
        );
        helpers.setSubmitting(false);
        return;
      }

      clearFeedback();
      setIsVerifyingIdentityLink(true);

      try {
        await axios.post<IdentityLinkResponse>(
          "/api/v2/auth/identity-link/verify",
          {
            linkId: identityLinkFlow.id,
            code: values.code.trim(),
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        helpers.resetForm();
        setIdentityLinkFlow(null);
        setCardView("login");
        onLogin?.(formik.values.username, formik.values.password);
        router.push(redirectTo);
        router.refresh();
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
              "No pudimos completar la vinculación. Intentá nuevamente.",
            ),
          );
        } else {
          setErrorMessage(
            "No pudimos completar la vinculación. Intentá nuevamente.",
          );
        }
      } finally {
        setIsVerifyingIdentityLink(false);
        helpers.setSubmitting(false);
      }
    },
  });

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: loginValidationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      clearFeedback();
      setMfaState(null);

      try {
        const { data } = await axios.post<LoginResponse>(
          "/api/auth/login",
          {
            username: values.username,
            password: values.password,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (data?.mfa?.required) {
          const selectedChannel = data.mfa.channels?.includes("email")
            ? "email"
            : (data.mfa.channels?.[0] ?? "email");

          try {
            await axios.post(
              "/api/auth/mfa/challenge",
              {
                loginTicket: data.mfa.loginTicket,
                channel: selectedChannel,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );

            
            setMfaState({
              ...data.mfa,
              challengeChannel: selectedChannel,
            });
            setMfaResendCooldownSeconds(MFA_RESEND_COOLDOWN_SECONDS);
            setCardView("mfa");
            return;
          } catch (challengeError) {
            if (axios.isAxiosError<LoginResponse>(challengeError)) {
              setErrorMessage(
                getErrorMessage(
                  challengeError.response?.data ?? null,
                  "No pudimos iniciar el challenge MFA.",
                ),
              );
            } else {
              setErrorMessage("No pudimos iniciar el challenge MFA.");
            }
            return;
          }
        }

        try {
          await finishLoginIfIdentityLinked(values.username, values.password);
        } catch (identityError) {
          if (
            identityError instanceof Error &&
            identityError.message === "CLIENT_LINK_MISSING"
          ) {
            openIdentityLinkCard(
              "Completá tus datos para vincular tu cuenta y poder continuar.",
            );
            return;
          }

          setErrorMessage(
            "No pudimos validar el vínculo de tu cuenta. Intentá nuevamente.",
          );
        }
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          const payload = error.response?.data ?? null;
          const errorCode = getErrorCode(payload);

          if (errorCode === "AUTH_EMAIL_NOT_VERIFIED") {
            openVerifyOnboardingCard(
              onboardingFlow?.destinationMasked
                ? `Tu cuenta todavía no completó el onboarding. Revisá el email que enviamos a ${onboardingFlow.destinationMasked}.`
                : "Tu cuenta todavía no completó el onboarding. Revisá el email que te enviamos para continuar.",
            );
            return;
          }

          setErrorMessage(
            getErrorMessage(
              payload,
              "No pudimos iniciar sesión. Verificá tus datos e intentá nuevamente.",
            ),
          );
        } else {
          setErrorMessage(
            "No pudimos conectar con el servicio de autenticación. Intentá nuevamente.",
          );
        }
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const forgotPasswordFormik = useFormik<ForgotPasswordFormValues>({
    initialValues: {
      identifier: "",
    },
    validationSchema: forgotPasswordValidationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      clearFeedback();

      try {
        const { data } = await axios.post<ForgotPasswordResponse>(
          "/api/auth/forgot-password",
          {
            identifier: values.identifier,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (data.challenge?.id) {
          resetPasswordFormik.resetForm();
          setPasswordRecoveryState({
            challengeId: data.challenge.id,
            identifier: values.identifier,
            expiresAt: data.challenge.expiresAt,
          });
          setCardView("reset-password");
          setInfoMessage("Te enviamos un código de 6 dígitos al email indicado.");
          helpers.resetForm();
          return;
        }

        setInfoMessage(
          data.message && typeof data.message === "string"
            ? data.message
            : "Si la cuenta existe, enviaremos instrucciones de recuperación al canal configurado.",
        );
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
              "No pudimos iniciar la recuperación de contraseña. Intentá nuevamente.",
            ),
          );
        } else {
          setErrorMessage(
            "No pudimos iniciar la recuperación de contraseña. Intentá nuevamente.",
          );
        }
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const resetPasswordFormik = useFormik<ResetPasswordFormValues>({
    initialValues: {
      code: "",
      newPassword: "",
    },
    validationSchema: resetPasswordValidationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      if (!passwordRecoveryState?.challengeId) {
        setErrorMessage(
          "No encontramos una solicitud activa para restablecer la contraseña.",
        );
        helpers.setSubmitting(false);
        return;
      }

      clearFeedback();

      try {
        await axios.post<LoginResponse>(
          "/api/auth/reset-password",
          {
            challengeId: passwordRecoveryState.challengeId,
            code: values.code,
            newPassword: values.newPassword,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        helpers.resetForm();
        setPasswordRecoveryState(null);
        setCardView("login");
        setInfoMessage(
          "Tu contraseña fue actualizada correctamente. Iniciá sesión con la nueva clave.",
        );
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
              "No pudimos restablecer tu contraseña. Verificá el código e intentá nuevamente.",
            ),
          );
        } else {
          setErrorMessage(
            "No pudimos restablecer tu contraseña. Intentá nuevamente.",
          );
        }
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const handleResendMfaCode = async () => {
    if (
      mfaResendCooldownSeconds > 0 ||
      !mfaState?.loginTicket ||
      !mfaState?.challengeChannel
    ) {
      setErrorMessage("No pudimos reenviar el código. Volvé a iniciar sesión.");
      return;
    }

    setIsResendingMfaCode(true);
    clearFeedback();

    try {
      const { data } = await axios.post<LoginResponse>(
        "/api/auth/mfa/challenge",
        {
          loginTicket: mfaState.loginTicket,
          channel: mfaState.challengeChannel,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      setInfoMessage(
        typeof data?.message === "string"
          ? data.message
          : `Te enviamos un nuevo código por ${mfaState.challengeChannel}.`,
      );
      setMfaResendCooldownSeconds(MFA_RESEND_COOLDOWN_SECONDS);
      setMfaInputResetKey((currentValue) => currentValue + 1);
    } catch (error) {
      if (axios.isAxiosError<LoginResponse>(error)) {
        setErrorMessage(
          getErrorMessage(
            error.response?.data ?? null,
            "No pudimos reenviar el código. Intentá nuevamente.",
          ),
        );
      } else {
        setErrorMessage("No pudimos reenviar el código. Intentá nuevamente.");
      }
    } finally {
      setIsResendingMfaCode(false);
    }
  };

  const handleResendOnboarding = async () => {
    if (!onboardingFlow?.id) {
      setErrorMessage("No encontramos un onboarding activo para reenviar.");
      return;
    }

    setIsResendingOnboarding(true);
    clearFeedback();

    try {
      const { data } = await axios.post<LoginResponse>(
        "/api/v2/auth/onboarding/resend",
        {
          flowId: onboardingFlow.id,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      setOnboardingFlow((current) =>
        current
          ? {
              ...current,
              status: data.flow?.status ?? current.status,
              expiresAt: data.flow?.expiresAt ?? current.expiresAt,
              destinationMasked:
                data.challenge?.destinationMasked ?? current.destinationMasked,
              channel: data.challenge?.channel ?? current.channel,
            }
          : current,
      );
      setInfoMessage(
        data.challenge?.destinationMasked
          ? `Te reenviamos el email de validación a ${data.challenge.destinationMasked}.`
          : "Te reenviamos el email de validación.",
      );
    } catch (error) {
      if (axios.isAxiosError<LoginResponse>(error)) {
        setErrorMessage(
          getErrorMessage(
            error.response?.data ?? null,
            "No pudimos reenviar el email de onboarding. Intentá nuevamente.",
          ),
        );
      } else {
        setErrorMessage(
          "No pudimos reenviar el email de onboarding. Intentá nuevamente.",
        );
      }
    } finally {
      setIsResendingOnboarding(false);
    }
  };

  const startGooglePopupLogin = (forceAccountSelection = false) => {
    if (isGooglePopupLoading) {
      return;
    }

    clearFeedback();
    setIsGooglePopupLoading(true);

    const promptParam = forceAccountSelection
      ? `&prompt=${encodeURIComponent("select_account consent")}`
      : "";

    if (typeof window === "undefined") {
      return;
    }

    const startUrl = `/api/v2/auth/providers/google/start?redirectTo=${encodeURIComponent(redirectTo)}${promptParam}`;
    window.location.assign(startUrl);
  };
  useEffect(() => {
    if (cardView !== "mfa" || mfaResendCooldownSeconds <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMfaResendCooldownSeconds((currentValue) =>
        currentValue > 0 ? currentValue - 1 : 0,
      );
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [cardView, mfaResendCooldownSeconds]);

  useEffect(() => {
    if (identityLinkHint !== "pending" || hasOpenedIdentityLinkFromHint) {
      return;
    }

    const startIdentityLinkFlow = async () => {
      setHasOpenedIdentityLinkFromHint(true);

      try {
        const identityStatus = await getIdentityLinkStatus();

        if (identityStatus.link?.linked) {
          router.replace(redirectTo);
          return;
        }

        openIdentityLinkCard(
          "Completá tus datos para vincular tu cuenta y poder continuar.",
        );
        applyIdentityLinkPrefill(identityStatus);
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message === "CLIENT_LINK_MISSING" ||
            error.message === "IDENTITY_STATUS_FAILED")
        ) {
          openIdentityLinkCard(
            "Completá tus datos para vincular tu cuenta y poder continuar.",
          );
        }
      }
    };

    void startIdentityLinkFlow();
  }, [
    applyIdentityLinkPrefill,
    getIdentityLinkStatus,
    hasOpenedIdentityLinkFromHint,
    identityLinkHint,
    openIdentityLinkCard,
    redirectTo,
    router,
  ]);

  useEffect(() => {
    if (onboardingHint !== "verified" && onboardingHint !== "error") {
      return;
    }

    setCardView("login");
    setOnboardingFlow(null);
    setHasProcessedVerificationToken(true);

    if (onboardingHint === "verified") {
      clearFeedback();
      setInfoMessage(
        "Tu onboarding fue validado correctamente. Ahora podés iniciar sesión.",
      );
    } else {
      setInfoMessage(null);
      setErrorMessage(
        onboardingErrorCode
          ? mapAuthError(onboardingErrorCode)
          : "No pudimos validar tu onboarding. Solicitá un nuevo enlace.",
      );
    }

    syncSearchParams((params) => {
      params.delete("onboarding");
      params.delete("onboardingError");
      params.delete("token");
      params.delete("verificationToken");
      params.delete("onboardingToken");
    });
  }, [onboardingErrorCode, onboardingHint, syncSearchParams]);

  useEffect(() => {
    if (!verificationTokenFromUrl || hasProcessedVerificationToken) {
      return;
    }

    const verifyByToken = async () => {
      setHasProcessedVerificationToken(true);
      setIsAutoVerifyingOnboarding(true);
      setCardView("login");
      clearFeedback();
      setOnboardingFlow(null);
      setInfoMessage("Estamos validando el enlace que llegó por email...");

      try {
        await axios.post<LoginResponse>(
          "/api/v2/auth/onboarding/verify-token",
          {
            token: verificationTokenFromUrl,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        setCardView("login");
        setOnboardingFlow(null);
        setInfoMessage(
          "Tu onboarding fue validado correctamente. Ahora podés iniciar sesión.",
        );
      } catch (error) {
        setCardView("login");
        setOnboardingFlow(null);
        if (axios.isAxiosError<LoginResponse>(error)) {
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
              "No pudimos validar tu onboarding. Solicitá un nuevo enlace.",
            ),
          );
        } else {
          setErrorMessage(
            "No pudimos validar tu onboarding. Solicitá un nuevo enlace.",
          );
        }
      } finally {
        syncSearchParams((params) => {
          params.delete("token");
          params.delete("verificationToken");
          params.delete("onboardingToken");
        });
        setIsAutoVerifyingOnboarding(false);
      }
    };

    void verifyByToken();
  }, [hasProcessedVerificationToken, syncSearchParams, verificationTokenFromUrl]);

  useEffect(() => {
    const googleAuthError = searchParams.get("googleAuthError");

    if (!googleAuthError || hasProcessedGoogleAuthError) {
      return;
    }

    setHasProcessedGoogleAuthError(true);
    setErrorMessage(
      "No pudimos completar el inicio de sesión con Google. Intentá nuevamente.",
    );

    syncSearchParams((params) => {
      params.delete("googleAuthError");
    });
  }, [hasProcessedGoogleAuthError, searchParams, syncSearchParams]);

  useEffect(() => {
    if (!hasGoogleOnboardingHint) {
      return;
    }

    clearFeedback();
    setCardView("google-onboarding");
    setMfaState(null);
    setOnboardingFlow(null);
    setInfoMessage("Completá tus datos para terminar el onboarding con Google.");
  }, [hasGoogleOnboardingHint]);

  useEffect(() => {
    if (!hasGoogleOnboardingHint) {
      setGoogleProfilePrefill(null);
      return;
    }

    const googleEmail = searchParams.get("googleEmail")?.trim() || "";
    const googleFirstName = searchParams.get("googleFirstName")?.trim() || "";
    const googleLastName = searchParams.get("googleLastName")?.trim() || "";

    if (!googleEmail && !googleFirstName && !googleLastName) {
      return;
    }

    applyGoogleProfilePrefill({
      email: googleEmail,
      firstName: googleFirstName,
      lastName: googleLastName,
    });
  }, [applyGoogleProfilePrefill, hasGoogleOnboardingHint, searchParams]);

  const usernameHasError = Boolean(formik.touched.username && formik.errors.username);
  const passwordHasError = Boolean(formik.touched.password && formik.errors.password);
  const registerEmailHasError = Boolean(
    registerFormik.touched.email && registerFormik.errors.email,
  );
  const registerPasswordHasError = Boolean(
    registerFormik.touched.password && registerFormik.errors.password,
  );
  const registerFirstNameHasError = Boolean(
    registerFormik.touched.firstName && registerFormik.errors.firstName,
  );
  const registerLastNameHasError = Boolean(
    registerFormik.touched.lastName && registerFormik.errors.lastName,
  );
  const registerDocumentTypeHasError = Boolean(
    registerFormik.touched.documentType && registerFormik.errors.documentType,
  );
  const registerDocumentNumberHasError = Boolean(
    registerFormik.touched.documentNumber && registerFormik.errors.documentNumber,
  );
  const registerSexHasError = Boolean(
    registerFormik.touched.sex && registerFormik.errors.sex,
  );
  const registerBirthDateHasError = Boolean(
    registerFormik.touched.birthDate && registerFormik.errors.birthDate,
  );
  const registerPhoneHasError = Boolean(
    registerFormik.touched.phone && registerFormik.errors.phone,
  );
  const googleFirstNameHasError = Boolean(
    googleOnboardingFormik.touched.firstName &&
      googleOnboardingFormik.errors.firstName,
  );
  const googleLastNameHasError = Boolean(
    googleOnboardingFormik.touched.lastName && googleOnboardingFormik.errors.lastName,
  );
  const googleDocumentTypeHasError = Boolean(
    googleOnboardingFormik.touched.documentType &&
      googleOnboardingFormik.errors.documentType,
  );
  const googleDocumentNumberHasError = Boolean(
    googleOnboardingFormik.touched.documentNumber &&
      googleOnboardingFormik.errors.documentNumber,
  );
  const googleSexHasError = Boolean(
    googleOnboardingFormik.touched.sex && googleOnboardingFormik.errors.sex,
  );
  const googleBirthDateHasError = Boolean(
    googleOnboardingFormik.touched.birthDate &&
      googleOnboardingFormik.errors.birthDate,
  );
  const googlePhoneHasError = Boolean(
    googleOnboardingFormik.touched.phone && googleOnboardingFormik.errors.phone,
  );
  const identityLinkEmailHasError = Boolean(
    identityLinkFormik.touched.email && identityLinkFormik.errors.email,
  );
  const identityLinkFirstNameHasError = Boolean(
    identityLinkFormik.touched.firstName && identityLinkFormik.errors.firstName,
  );
  const identityLinkLastNameHasError = Boolean(
    identityLinkFormik.touched.lastName && identityLinkFormik.errors.lastName,
  );
  const identityLinkDocumentTypeHasError = Boolean(
    identityLinkFormik.touched.documentType &&
      identityLinkFormik.errors.documentType,
  );
  const identityLinkDocumentNumberHasError = Boolean(
    identityLinkFormik.touched.documentNumber &&
      identityLinkFormik.errors.documentNumber,
  );
  const identityLinkSexHasError = Boolean(
    identityLinkFormik.touched.sex && identityLinkFormik.errors.sex,
  );
  const identityLinkBirthDateHasError = Boolean(
    identityLinkFormik.touched.birthDate && identityLinkFormik.errors.birthDate,
  );
  const identityLinkPhoneHasError = Boolean(
    identityLinkFormik.touched.phone && identityLinkFormik.errors.phone,
  );
  const verifyOnboardingHasError = Boolean(
    verifyOnboardingFormik.touched.token && verifyOnboardingFormik.errors.token,
  );
  const identityLinkCodeHasError = Boolean(
    identityLinkVerifyFormik.touched.code && identityLinkVerifyFormik.errors.code,
  );
  const forgotPasswordHasError = Boolean(
    forgotPasswordFormik.touched.identifier &&
      forgotPasswordFormik.errors.identifier,
  );
  const resetPasswordCodeHasError = Boolean(
    resetPasswordFormik.touched.code && resetPasswordFormik.errors.code,
  );
  const resetPasswordHasError = Boolean(
    resetPasswordFormik.touched.newPassword &&
      resetPasswordFormik.errors.newPassword,
  );

  const legalLinks = (
    <div className={styles.legalLinks}>
      <a href="#" className={styles.inlineLink}>
        Términos de uso
      </a>
      {" · "}
      <a href="#" className={styles.inlineLink}>
        Política de privacidad
      </a>
    </div>
  );

  return (
    <section className={styles.root}>
      <aside className={styles.heroPanel}>
        <div className={styles.heroBackdrop} aria-hidden="true">
          <div className={styles.heroOrbPrimary}></div>
          <div className={styles.heroOrbSecondary}></div>
        </div>
        <div className={styles.heroContent}>
          <Image
            src={loginLogo}
            alt="Farmacias Sanchez Antoniolli"
            width={180}
            height={60}
            className={styles.heroLogo}
            priority
          />
          <h1 className={styles.heroTitle}>Gestión inteligente</h1>
          <h2 className={styles.heroAccent}>para tu farmacia</h2>
          <p className={styles.heroDescription}>
            Control total sobre tus pedidos, clientes y gestión de entregas de tu farmacia en un solo lugar.
          </p>
          <ul className={styles.benefitsList}>
            {BENEFITS.map((benefit) => (
              <li key={benefit} className={styles.benefitItem}>
                <span className={styles.benefitIcon}>
                  <Check size={16} />
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.heroFooter}>
          © 2026 Farmacias Sanchez Antoniolli - Todos los derechos reservados
        </p>
      </aside>
      <div className={styles.contentPanel}>
        <Image
          src={mobileLogo}
          alt="Farmacias Sanchez Antoniolli"
          width={232}
          height={90}
          className={styles.mobileLogo}
          priority
        />
        <div className={styles.formCard}>
          <AnimatePresence mode="wait">
            {cardView === "login" ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -32 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
              >
                <header className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Iniciar sesión</h2>
                  <p className={styles.formSubtitle}>Ingresá a tu cuenta</p>
                </header>
                {infoMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                    {infoMessage}
                  </div>
                ) : null}
                {googleProfilePrefill?.email ? (
                  <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                    Cuenta Google detectada: {googleProfilePrefill.email}
                  </div>
                ) : null}
                {errorMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackError}`}>
                    {errorMessage}
                  </div>
                ) : null}
                <form onSubmit={formik.handleSubmit} className={styles.form} noValidate>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="login-email">
                      Usuario
                    </label>
                    <input
                      id="login-email"
                      name="username"
                      type="text"
                      placeholder="Ingresá tu usuario"
                      value={formik.values.username}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      autoComplete="username"
                      required
                      className={`${styles.input} ${usernameHasError ? styles.inputError : ""}`}
                    />
                    {usernameHasError ? (
                      <p className={styles.fieldError}>{formik.errors.username}</p>
                    ) : null}
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldHeader}>
                      <label className={styles.fieldLabel} htmlFor="login-password">
                        Contraseña
                      </label>
                      <button
                        type="button"
                        className={styles.inlineButton}
                        onClick={() => {
                          setCardView("forgot-password");
                          clearFeedback();
                          setPasswordRecoveryState(null);
                          forgotPasswordFormik.resetForm();
                          resetPasswordFormik.resetForm();
                        }}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className={styles.passwordField}>
                      <input
                        id="login-password"
                        name="password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Ingresá tu contraseña"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        autoComplete="current-password"
                        required
                        className={`${styles.input} ${styles.passwordInput} ${passwordHasError ? styles.inputError : ""}`}
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        aria-label={showLoginPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-pressed={showLoginPassword}
                        onClick={() =>
                          setShowLoginPassword((currentValue) => !currentValue)
                        }
                      >
                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordHasError ? (
                      <p className={styles.fieldError}>{formik.errors.password}</p>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={formik.isSubmitting}
                  >
                    <LogIn size={20} />
                    <span>
                      {formik.isSubmitting ? "Ingresando..." : "Ingresar al sistema"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={formik.isSubmitting}
                    onClick={() => {
                      setCardView("register");
                      clearFeedback();
                      setOnboardingFlow(null);
                    }}
                  >
                    <UserPlus size={20} />
                    <span>Crear nuevo perfil</span>
                  </button>
                </form>
                <div className={styles.separator}>
                  <div className={styles.separatorLine}></div>
                  <span className={styles.separatorText}>O</span>
                  <div className={styles.separatorLine}></div>
                </div>
                <button
                  type="button"
                  onClick={() => startGooglePopupLogin()}
                  className={styles.googleButton}
                  disabled={formik.isSubmitting || isGooglePopupLoading}
                >
                  <Image src={googleLogo} alt="Google" width={20} height={20} />
                  <span>
                    {isGooglePopupLoading
                      ? "Conectando con Google..."
                      : "Continuar con Google"}
                  </span>
                </button>
                {legalLinks}
              </motion.div>
            ) : null}

            {cardView === "register" ? (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -32 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
              >
                <header className={styles.formHeader}>
                  <div className={styles.mfaHeaderRow}>
                    <h2 className={styles.formTitle}>Crear perfil</h2>
                    <button
                      type="button"
                      className={styles.mfaBackIconButton}
                      onClick={() => {
                        returnToLogin();
                        registerFormik.resetForm();
                      }}
                      aria-label="Volver al inicio de sesión"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  </div>
                  <p className={styles.formSubtitle}>
                    Completá tus datos para iniciar el onboarding unificado.
                  </p>
                </header>
                {errorMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackError}`}>
                    {errorMessage}
                  </div>
                ) : null}
                {infoMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                    {infoMessage}
                  </div>
                ) : null}
                <form onSubmit={registerFormik.handleSubmit} className={styles.form} noValidate>
                  <div className={`${styles.fieldRow} ${styles.fieldRowFullWidth}`}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="register-email">
                        Email
                      </label>
                      <input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="Ingresá tu email"
                        value={registerFormik.values.email}
                        onChange={registerFormik.handleChange}
                        onBlur={registerFormik.handleBlur}
                        autoComplete="email"
                        className={`${styles.input} ${registerEmailHasError ? styles.inputError : ""}`}
                      />
                      {registerEmailHasError ? (
                        <p className={styles.fieldError}>{registerFormik.errors.email}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="register-password">
                      Contraseña
                    </label>
                    <div className={styles.passwordField}>
                      <input
                        id="register-password"
                        name="password"
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Creá una contraseña"
                        value={registerFormik.values.password}
                        onChange={registerFormik.handleChange}
                        onBlur={registerFormik.handleBlur}
                        autoComplete="new-password"
                        className={`${styles.input} ${styles.passwordInput} ${registerPasswordHasError ? styles.inputError : ""}`}
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        aria-label={showRegisterPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-pressed={showRegisterPassword}
                        onClick={() =>
                          setShowRegisterPassword((currentValue) => !currentValue)
                        }
                      >
                        {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {registerPasswordHasError ? (
                      <p className={styles.fieldError}>{registerFormik.errors.password}</p>
                    ) : null}
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="register-first-name">
                        Nombre
                      </label>
                      <input
                        id="register-first-name"
                        name="firstName"
                        type="text"
                        placeholder="Ingresá tu nombre"
                        value={registerFormik.values.firstName}
                        onChange={registerFormik.handleChange}
                        onBlur={registerFormik.handleBlur}
                        autoComplete="given-name"
                        className={`${styles.input} ${registerFirstNameHasError ? styles.inputError : ""}`}
                      />
                      {registerFirstNameHasError ? (
                        <p className={styles.fieldError}>{registerFormik.errors.firstName}</p>
                      ) : null}
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="register-last-name">
                        Apellido
                      </label>
                      <input
                        id="register-last-name"
                        name="lastName"
                        type="text"
                        placeholder="Ingresá tu apellido"
                        value={registerFormik.values.lastName}
                        onChange={registerFormik.handleChange}
                        onBlur={registerFormik.handleBlur}
                        autoComplete="family-name"
                        className={`${styles.input} ${registerLastNameHasError ? styles.inputError : ""}`}
                      />
                      {registerLastNameHasError ? (
                        <p className={styles.fieldError}>{registerFormik.errors.lastName}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="register-document-type">
                        Tipo de documento
                      </label>
                      <select
                        id="register-document-type"
                        name="documentType"
                        value={registerFormik.values.documentType}
                        onChange={registerFormik.handleChange}
                        onBlur={registerFormik.handleBlur}
                        className={`${styles.input} ${registerDocumentTypeHasError ? styles.inputError : ""}`}
                      >
                        <option value="DNI">DNI</option>
                        <option value="CI">CI</option>
                        <option value="PASAPORTE">Pasaporte</option>
                      </select>
                      {registerDocumentTypeHasError ? (
                        <p className={styles.fieldError}>{registerFormik.errors.documentType}</p>
                      ) : null}
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="register-document-number">
                        Número de documento
                      </label>
                      <input
                        id="register-document-number"
                        name="documentNumber"
                        type="text"
                        placeholder="Ingresá tu documento"
                        value={registerFormik.values.documentNumber}
                        onChange={registerFormik.handleChange}
                        onBlur={registerFormik.handleBlur}
                        className={`${styles.input} ${registerDocumentNumberHasError ? styles.inputError : ""}`}
                      />
                      {registerDocumentNumberHasError ? (
                        <p className={styles.fieldError}>{registerFormik.errors.documentNumber}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="register-sex">
                        Sexo
                      </label>
                      <select
                        id="register-sex"
                        name="sex"
                        value={registerFormik.values.sex}
                        onChange={registerFormik.handleChange}
                        onBlur={registerFormik.handleBlur}
                        className={`${styles.input} ${registerSexHasError ? styles.inputError : ""}`}
                      >
                        <option value="">Seleccioná una opción</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="X">No binario / X</option>
                      </select>
                      {registerSexHasError ? (
                        <p className={styles.fieldError}>{registerFormik.errors.sex}</p>
                      ) : null}
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="register-birth-date">
                        Fecha de nacimiento
                      </label>
                      <input
                        id="register-birth-date"
                        name="birthDate"
                        type="date"
                        value={registerFormik.values.birthDate}
                        onChange={registerFormik.handleChange}
                        onBlur={registerFormik.handleBlur}
                        className={`${styles.input} ${registerBirthDateHasError ? styles.inputError : ""}`}
                      />
                      {registerBirthDateHasError ? (
                        <p className={styles.fieldError}>{registerFormik.errors.birthDate}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="register-phone">
                      Teléfono
                    </label>
                    <input
                      id="register-phone"
                      name="phone"
                      type="tel"
                      placeholder="+5491112345678"
                      value={registerFormik.values.phone}
                      onChange={registerFormik.handleChange}
                      onBlur={registerFormik.handleBlur}
                      autoComplete="tel"
                      className={`${styles.input} ${registerPhoneHasError ? styles.inputError : ""}`}
                    />
                    {registerPhoneHasError ? (
                      <p className={styles.fieldError}>{registerFormik.errors.phone}</p>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={registerFormik.isSubmitting}
                  >
                    <UserPlus size={20} />
                    <span>
                      {registerFormik.isSubmitting
                        ? "Iniciando registro..."
                        : "Comenzar registro"}
                    </span>
                  </button>
                </form>
                {legalLinks}
              </motion.div>
            ) : null}

            {cardView === "verify-onboarding" ? (
              <motion.div
                key="verify-onboarding-form"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -32 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
              >
                <header className={styles.formHeader}>
                  <div className={styles.mfaHeaderRow}>
                    <h2 className={styles.formTitle}>Terminar registro</h2>
                    <button
                      type="button"
                      className={styles.mfaBackIconButton}
                      onClick={() => {
                        returnToLogin();
                        setOnboardingFlow(null);
                      }}
                      aria-label="Volver al inicio de sesión"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  </div>
                  <p className={styles.formSubtitle}>
                    Te enviamos un email para completar tu registro. Abrí el enlace para continuar.
                  </p>
                </header>
                {infoMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                    {infoMessage}
                  </div>
                ) : null}
                {errorMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackError}`}>
                    {errorMessage}
                  </div>
                ) : null}
                {onboardingFlow?.destinationMasked ? (
                  <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                    Email destino: {onboardingFlow.destinationMasked}
                  </div>
                ) : null}
                {isAutoVerifyingOnboarding ? (
                  <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                    Validando el enlace del email...
                  </div>
                ) : null}
                <div className={styles.form}>
                  <div className={styles.fieldGroup} style={{ display: "none" }}>
                    <label className={styles.fieldLabel} htmlFor="verify-onboarding-token">
                      Token
                    </label>
                    <input
                      id="verify-onboarding-token"
                      name="token"
                      type="text"
                      placeholder="Pegá el token recibido"
                      value={verifyOnboardingFormik.values.token}
                      onChange={verifyOnboardingFormik.handleChange}
                      onBlur={verifyOnboardingFormik.handleBlur}
                      disabled={isAutoVerifyingOnboarding}
                      className={`${styles.input} ${verifyOnboardingHasError ? styles.inputError : ""}`}
                    />
                    {verifyOnboardingHasError ? (
                      <p className={styles.fieldError}>{verifyOnboardingFormik.errors.token}</p>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={verifyOnboardingFormik.isSubmitting || isAutoVerifyingOnboarding}
                    style={{ display: "none" }}
                  >
                    <span>
                      {isAutoVerifyingOnboarding
                        ? "Validando enlace..."
                        : verifyOnboardingFormik.isSubmitting
                        ? "Validando..."
                        : "Completar onboarding"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={
                      isAutoVerifyingOnboarding ||
                      isResendingOnboarding ||
                      !onboardingFlow?.id
                    }
                    onClick={() => {
                      void handleResendOnboarding();
                    }}
                  >
                    <span>
                      {isResendingOnboarding ? "Reenviando..." : "Reenviar email"}
                    </span>
                  </button>
                </div>
                {legalLinks}
              </motion.div>
            ) : null}

            {cardView === "identity-link" ? (
              <motion.div
                key="identity-link-form"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -32 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
              >
                <header className={styles.formHeader}>
                      <div className={styles.mfaHeaderRow}>
                        <h2 className={styles.formTitle}>Completar vinculación</h2>
                        <button
                          type="button"
                          className={styles.mfaBackIconButton}
                          onClick={() => {
                            returnToLogin();
                            identityLinkFormik.resetForm();
                          }}
                          aria-label="Volver al inicio de sesión"
                        >
                          <ArrowLeft size={20} />
                        </button>
                      </div>
                      <p className={styles.formSubtitle}>
                        Confirmá tus datos personales para vincular tu cuenta con tu cliente.
                      </p>
                    </header>
                    {infoMessage ? (
                      <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                        {infoMessage}
                      </div>
                    ) : null}
                    {errorMessage ? (
                      <div className={`${styles.feedback} ${styles.feedbackError}`}>
                        {errorMessage}
                      </div>
                    ) : null}
                    <form onSubmit={identityLinkFormik.handleSubmit} className={styles.form} noValidate>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="identity-link-email">
                          Email
                        </label>
                        <input
                          id="identity-link-email"
                          name="email"
                          type="email"
                          placeholder="Ingresa tu email"
                          value={identityLinkFormik.values.email ?? ""}
                          onChange={identityLinkFormik.handleChange}
                          onBlur={identityLinkFormik.handleBlur}
                          autoComplete="email"
                          className={`${styles.input} ${identityLinkEmailHasError ? styles.inputError : ""}`}
                        />
                        {identityLinkEmailHasError ? (
                          <p className={styles.fieldError}>{identityLinkFormik.errors.email}</p>
                        ) : null}
                      </div>
                      <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor="identity-link-first-name">
                            Nombre
                          </label>
                          <input
                            id="identity-link-first-name"
                            name="firstName"
                            type="text"
                            placeholder="Ingresá tu nombre"
                            value={identityLinkFormik.values.firstName ?? ""}
                            onChange={identityLinkFormik.handleChange}
                            onBlur={identityLinkFormik.handleBlur}
                            className={`${styles.input} ${identityLinkFirstNameHasError ? styles.inputError : ""}`}
                          />
                          {identityLinkFirstNameHasError ? (
                            <p className={styles.fieldError}>{identityLinkFormik.errors.firstName}</p>
                          ) : null}
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor="identity-link-last-name">
                            Apellido
                          </label>
                          <input
                            id="identity-link-last-name"
                            name="lastName"
                            type="text"
                            placeholder="Ingresá tu apellido"
                            value={identityLinkFormik.values.lastName ?? ""}
                            onChange={identityLinkFormik.handleChange}
                            onBlur={identityLinkFormik.handleBlur}
                            className={`${styles.input} ${identityLinkLastNameHasError ? styles.inputError : ""}`}
                          />
                          {identityLinkLastNameHasError ? (
                            <p className={styles.fieldError}>{identityLinkFormik.errors.lastName}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor="identity-link-document-type">
                            Tipo de documento
                          </label>
                          <select
                            id="identity-link-document-type"
                            name="documentType"
                            value={identityLinkFormik.values.documentType ?? ""}
                            onChange={identityLinkFormik.handleChange}
                            onBlur={identityLinkFormik.handleBlur}
                            className={`${styles.input} ${identityLinkDocumentTypeHasError ? styles.inputError : ""}`}
                          >
                            <option value="DNI">DNI</option>
                            <option value="CI">CI</option>
                            <option value="PASAPORTE">Pasaporte</option>
                          </select>
                          {identityLinkDocumentTypeHasError ? (
                            <p className={styles.fieldError}>{identityLinkFormik.errors.documentType}</p>
                          ) : null}
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor="identity-link-document-number">
                            Número de documento
                          </label>
                          <input
                            id="identity-link-document-number"
                            name="documentNumber"
                            type="text"
                            placeholder="Ingresá tu documento"
                            value={identityLinkFormik.values.documentNumber ?? ""}
                            onChange={identityLinkFormik.handleChange}
                            onBlur={identityLinkFormik.handleBlur}
                            className={`${styles.input} ${identityLinkDocumentNumberHasError ? styles.inputError : ""}`}
                          />
                          {identityLinkDocumentNumberHasError ? (
                            <p className={styles.fieldError}>{identityLinkFormik.errors.documentNumber}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor="identity-link-sex">
                            Sexo
                          </label>
                          <select
                            id="identity-link-sex"
                            name="sex"
                            value={identityLinkFormik.values.sex ?? ""}
                            onChange={identityLinkFormik.handleChange}
                            onBlur={identityLinkFormik.handleBlur}
                            className={`${styles.input} ${identityLinkSexHasError ? styles.inputError : ""}`}
                          >
                            <option value="">Seleccioná una opción</option>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                            <option value="X">No binario / X</option>
                          </select>
                          {identityLinkSexHasError ? (
                            <p className={styles.fieldError}>{identityLinkFormik.errors.sex}</p>
                          ) : null}
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor="identity-link-birth-date">
                            Fecha de nacimiento
                          </label>
                          <input
                            id="identity-link-birth-date"
                            name="birthDate"
                            type="date"
                            value={identityLinkFormik.values.birthDate ?? ""}
                            onChange={identityLinkFormik.handleChange}
                            onBlur={identityLinkFormik.handleBlur}
                            className={`${styles.input} ${identityLinkBirthDateHasError ? styles.inputError : ""}`}
                          />
                          {identityLinkBirthDateHasError ? (
                            <p className={styles.fieldError}>{identityLinkFormik.errors.birthDate}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="identity-link-phone">
                          Teléfono
                        </label>
                        <input
                          id="identity-link-phone"
                          name="phone"
                          type="tel"
                          placeholder="+5491112345678"
                          value={identityLinkFormik.values.phone ?? ""}
                          onChange={identityLinkFormik.handleChange}
                          onBlur={identityLinkFormik.handleBlur}
                          className={`${styles.input} ${identityLinkPhoneHasError ? styles.inputError : ""}`}
                        />
                        {identityLinkPhoneHasError ? (
                          <p className={styles.fieldError}>{identityLinkFormik.errors.phone}</p>
                        ) : null}
                      </div>
                      <button
                        type="submit"
                        className={styles.primaryButton}
                        disabled={identityLinkFormik.isSubmitting || isStartingIdentityLink}
                      >
                        <span>
                          {isStartingIdentityLink
                            ? "Enviando código..."
                            : "Continuar vinculación"}
                        </span>
                      </button>
                    </form>
                {legalLinks}
              </motion.div>
            ) : null}

            {cardView === "identity-link-verify" ? (
              <motion.div
                key="identity-link-verify-form"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -32 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
              >
                <header className={styles.formHeader}>
                  <div className={styles.mfaHeaderRow}>
                    <h2 className={styles.formTitle}>Validar vinculación</h2>
                    <button
                      type="button"
                      className={styles.mfaBackIconButton}
                      onClick={() => {
                        identityLinkVerifyFormik.resetForm();
                        setCardView("identity-link");
                        clearFeedback();
                      }}
                      aria-label="Volver al formulario"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  </div>
                  <p className={styles.formSubtitle}>
                    Ingresá el código que te enviamos para completar la vinculación de tu cuenta.
                  </p>
                </header>
                {infoMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                    {infoMessage}
                  </div>
                ) : null}
                {errorMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackError}`}>
                    {errorMessage}
                  </div>
                ) : null}
                {identityLinkFlow?.destinationMasked ? (
                  <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                    Email destino: {identityLinkFlow.destinationMasked}
                  </div>
                ) : null}
                <form onSubmit={identityLinkVerifyFormik.handleSubmit} className={styles.form} noValidate>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="identity-link-code">
                      Código
                    </label>
                    <div className={styles.otpField}>
                      <OtpCodeInput
                        describedBy={identityLinkCodeHasError ? "identity-link-code-error" : undefined}
                        isInvalid={identityLinkCodeHasError}
                        value={identityLinkVerifyFormik.values.code}
                        onChange={(value) => {
                          void identityLinkVerifyFormik.setFieldValue("code", value);
                        }}
                      />
                    </div>
                    {identityLinkCodeHasError ? (
                      <p className={styles.fieldError} id="identity-link-code-error">
                        {identityLinkVerifyFormik.errors.code}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={identityLinkVerifyFormik.isSubmitting || isVerifyingIdentityLink}
                  >
                    <span>
                      {isVerifyingIdentityLink
                        ? "Validando..."
                        : "Completar vinculación"}
                    </span>
                  </button>
                </form>
                {legalLinks}
              </motion.div>
            ) : null}

            {cardView === "google-onboarding" ? (
              <motion.div
                key="google-onboarding-form"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -32 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
              >
                <header className={styles.formHeader}>
                  <div className={styles.mfaHeaderRow}>
                    <h2 className={styles.formTitle}>Completar alta con Google</h2>
                    <button
                      type="button"
                      className={styles.mfaBackIconButton}
                      onClick={() => {
                        returnToLogin();
                        googleOnboardingFormik.resetForm();
                        syncSearchParams((params) => {
                          params.delete("onboarding");
                          params.delete("googleOnboarding");
                        });
                      }}
                      aria-label="Volver al inicio de sesión"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  </div>
                  <p className={styles.formSubtitle}>
                    Confirmá tus datos personales para vincular la identidad y confiar este dispositivo.
                  </p>
                </header>
                {infoMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                    {infoMessage}
                  </div>
                ) : null}
                {errorMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackError}`}>
                    {errorMessage}
                  </div>
                ) : null}
                <form onSubmit={googleOnboardingFormik.handleSubmit} className={styles.form} noValidate>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="google-first-name">
                        Nombre
                      </label>
                      <input
                        id="google-first-name"
                        name="firstName"
                        type="text"
                        placeholder="Ingresá tu nombre"
                        value={googleOnboardingFormik.values.firstName}
                        onChange={googleOnboardingFormik.handleChange}
                        onBlur={googleOnboardingFormik.handleBlur}
                        className={`${styles.input} ${googleFirstNameHasError ? styles.inputError : ""}`}
                      />
                      {googleFirstNameHasError ? (
                        <p className={styles.fieldError}>{googleOnboardingFormik.errors.firstName}</p>
                      ) : null}
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="google-last-name">
                        Apellido
                      </label>
                      <input
                        id="google-last-name"
                        name="lastName"
                        type="text"
                        placeholder="Ingresá tu apellido"
                        value={googleOnboardingFormik.values.lastName}
                        onChange={googleOnboardingFormik.handleChange}
                        onBlur={googleOnboardingFormik.handleBlur}
                        className={`${styles.input} ${googleLastNameHasError ? styles.inputError : ""}`}
                      />
                      {googleLastNameHasError ? (
                        <p className={styles.fieldError}>{googleOnboardingFormik.errors.lastName}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="google-document-type">
                        Tipo de documento
                      </label>
                      <select
                        id="google-document-type"
                        name="documentType"
                        value={googleOnboardingFormik.values.documentType}
                        onChange={googleOnboardingFormik.handleChange}
                        onBlur={googleOnboardingFormik.handleBlur}
                        className={`${styles.input} ${googleDocumentTypeHasError ? styles.inputError : ""}`}
                      >
                        <option value="DNI">DNI</option>
                        <option value="CI">CI</option>
                        <option value="PASAPORTE">Pasaporte</option>
                      </select>
                      {googleDocumentTypeHasError ? (
                        <p className={styles.fieldError}>{googleOnboardingFormik.errors.documentType}</p>
                      ) : null}
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="google-document-number">
                        Número de documento
                      </label>
                      <input
                        id="google-document-number"
                        name="documentNumber"
                        type="text"
                        placeholder="Ingresá tu documento"
                        value={googleOnboardingFormik.values.documentNumber}
                        onChange={googleOnboardingFormik.handleChange}
                        onBlur={googleOnboardingFormik.handleBlur}
                        className={`${styles.input} ${googleDocumentNumberHasError ? styles.inputError : ""}`}
                      />
                      {googleDocumentNumberHasError ? (
                        <p className={styles.fieldError}>{googleOnboardingFormik.errors.documentNumber}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="google-sex">
                        Sexo
                      </label>
                      <select
                        id="google-sex"
                        name="sex"
                        value={googleOnboardingFormik.values.sex}
                        onChange={googleOnboardingFormik.handleChange}
                        onBlur={googleOnboardingFormik.handleBlur}
                        className={`${styles.input} ${googleSexHasError ? styles.inputError : ""}`}
                      >
                        <option value="">Seleccioná una opción</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="X">No binario / X</option>
                      </select>
                      {googleSexHasError ? (
                        <p className={styles.fieldError}>{googleOnboardingFormik.errors.sex}</p>
                      ) : null}
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="google-birth-date">
                        Fecha de nacimiento
                      </label>
                      <input
                        id="google-birth-date"
                        name="birthDate"
                        type="date"
                        value={googleOnboardingFormik.values.birthDate}
                        onChange={googleOnboardingFormik.handleChange}
                        onBlur={googleOnboardingFormik.handleBlur}
                        className={`${styles.input} ${googleBirthDateHasError ? styles.inputError : ""}`}
                      />
                      {googleBirthDateHasError ? (
                        <p className={styles.fieldError}>{googleOnboardingFormik.errors.birthDate}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="google-phone">
                      Teléfono
                    </label>
                    <input
                      id="google-phone"
                      name="phone"
                      type="tel"
                      placeholder="+5491112345678"
                      value={googleOnboardingFormik.values.phone}
                      onChange={googleOnboardingFormik.handleChange}
                      onBlur={googleOnboardingFormik.handleBlur}
                      className={`${styles.input} ${googlePhoneHasError ? styles.inputError : ""}`}
                    />
                    {googlePhoneHasError ? (
                      <p className={styles.fieldError}>{googleOnboardingFormik.errors.phone}</p>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={googleOnboardingFormik.isSubmitting || isCompletingGoogleOnboarding}
                  >
                    <span>
                      {isCompletingGoogleOnboarding
                        ? "Completando..."
                        : "Finalizar alta con Google"}
                    </span>
                  </button>
                </form>
                {legalLinks}
              </motion.div>
            ) : null}

            {cardView === "mfa" ? (
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -32 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
                style={{ width: "100%" }}
              >
                <header className={styles.formHeader}>
                  <div className={styles.mfaHeaderRow}>
                    <h2 className={styles.formTitle}>Validación MFA</h2>
                    <button
                      type="button"
                      className={styles.mfaBackIconButton}
                      onClick={returnToLogin}
                      aria-label="Volver al inicio de sesión"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  </div>
                  <p className={styles.formSubtitle}>
                    Ingresá el código enviado por {mfaState?.challengeChannel || "tu canal seleccionado"}.
                  </p>
                </header>
                {errorMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackError}`}>
                    {errorMessage}
                  </div>
                ) : null}
                {infoMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                    {infoMessage}
                  </div>
                ) : null}
                <InputMFA
                  key={mfaState?.loginTicket}
                  resetTrigger={mfaInputResetKey}
                  onSubmit={async (code: string, rememberDevice: boolean) => {
                    setIsVerifyingMfa(true);
                    clearFeedback();
                    try {
                      const { data } = await axios.post<LoginResponse>(
                        "/api/auth/mfa/verify",
                        {
                          loginTicket: mfaState?.loginTicket,
                          code,
                          rememberDevice,
                        },
                        {
                          headers: { "Content-Type": "application/json" },
                        },
                      );

                      if (data.ok) {
                        await finishLoginIfIdentityLinked(
                          formik.values.username,
                          formik.values.password,
                        );
                        return;
                      }

                      setErrorMessage(
                        getErrorMessage(
                          data,
                          "No pudimos validar el código. Intentá nuevamente.",
                        ),
                      );
                    } catch (error) {
                      if (axios.isAxiosError<LoginResponse>(error)) {
                        setErrorMessage(
                          getErrorMessage(
                            error.response?.data ?? null,
                            "No pudimos validar el código. Intentá nuevamente.",
                          ),
                        );
                      } else {
                        setErrorMessage(
                          "No pudimos conectar con el servicio de autenticación. Intentá nuevamente.",
                        );
                      }
                    } finally {
                      setIsVerifyingMfa(false);
                    }
                  }}
                  isLoading={isVerifyingMfa}
                />
                <div className={styles.feedbackActions}>
                  {mfaResendCooldownSeconds > 0 ? (
                    <span className={styles.resendCooldownText}>
                      Podés reenviar el código en {mfaResendCooldownSeconds}s
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={styles.resendButton}
                    onClick={() => {
                      void handleResendMfaCode();
                    }}
                    disabled={
                      isResendingMfaCode ||
                      isVerifyingMfa ||
                      mfaResendCooldownSeconds > 0
                    }
                  >
                    {isResendingMfaCode ? "Reenviando código..." : "Reenviar código"}
                  </button>
                </div>
                {legalLinks}
              </motion.div>
            ) : null}

            {cardView === "forgot-password" ? (
              <motion.div
                key="forgot-password-form"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -32 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
              >
                <header className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Recuperar contraseña</h2>
                  <p className={styles.formSubtitle}>
                    Ingresá tu email para recibir el código de verificación
                  </p>
                </header>
                {infoMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                    {infoMessage}
                  </div>
                ) : null}
                {errorMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackError}`}>
                    {errorMessage}
                  </div>
                ) : null}
                <form onSubmit={forgotPasswordFormik.handleSubmit} className={styles.form} noValidate>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="forgot-password-identifier">
                      Email
                    </label>
                    <input
                      id="forgot-password-identifier"
                      name="identifier"
                      type="email"
                      placeholder="Ingresá tu email"
                      value={forgotPasswordFormik.values.identifier}
                      onChange={forgotPasswordFormik.handleChange}
                      onBlur={forgotPasswordFormik.handleBlur}
                      autoComplete="email"
                      className={`${styles.input} ${forgotPasswordHasError ? styles.inputError : ""}`}
                    />
                    {forgotPasswordHasError ? (
                      <p className={styles.fieldError}>{forgotPasswordFormik.errors.identifier}</p>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={forgotPasswordFormik.isSubmitting}
                  >
                    <span>
                      {forgotPasswordFormik.isSubmitting ? "Enviando..." : "Enviar código"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={forgotPasswordFormik.isSubmitting}
                    onClick={() => {
                      returnToLogin();
                      setPasswordRecoveryState(null);
                      forgotPasswordFormik.resetForm();
                    }}
                  >
                    Volver atrás
                  </button>
                </form>
                {legalLinks}
              </motion.div>
            ) : null}

            {cardView === "reset-password" ? (
              <motion.div
                key="reset-password-form"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -32 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
              >
                <header className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Nueva contraseña</h2>
                  <p className={styles.formSubtitle}>
                    Ingresá el código enviado a {passwordRecoveryState?.identifier} y definí tu nueva contraseña.
                  </p>
                </header>
                {infoMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                    {infoMessage}
                  </div>
                ) : null}
                {errorMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackError}`}>
                    {errorMessage}
                  </div>
                ) : null}
                <form onSubmit={resetPasswordFormik.handleSubmit} className={styles.form} noValidate>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="reset-password-code">
                      Código
                    </label>
                    <div className={styles.otpField}>
                      <OtpCodeInput
                        describedBy={resetPasswordCodeHasError ? "reset-password-code-error" : undefined}
                        isInvalid={resetPasswordCodeHasError}
                        value={resetPasswordFormik.values.code}
                        onChange={(value) => {
                          void resetPasswordFormik.setFieldValue("code", value);
                        }}
                      />
                    </div>
                    {resetPasswordCodeHasError ? (
                      <p className={styles.fieldError} id="reset-password-code-error">
                        {resetPasswordFormik.errors.code}
                      </p>
                    ) : null}
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="reset-password-new-password">
                      Nueva contraseña
                    </label>
                    <div className={styles.passwordField}>
                      <input
                        id="reset-password-new-password"
                        name="newPassword"
                        type={showResetPassword ? "text" : "password"}
                        placeholder="Ingresá tu nueva contraseña"
                        value={resetPasswordFormik.values.newPassword}
                        onChange={resetPasswordFormik.handleChange}
                        onBlur={resetPasswordFormik.handleBlur}
                        autoComplete="new-password"
                        className={`${styles.input} ${styles.passwordInput} ${resetPasswordHasError ? styles.inputError : ""}`}
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        aria-label={showResetPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-pressed={showResetPassword}
                        onClick={() =>
                          setShowResetPassword((currentValue) => !currentValue)
                        }
                      >
                        {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {resetPasswordHasError ? (
                      <p className={styles.fieldError}>{resetPasswordFormik.errors.newPassword}</p>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={resetPasswordFormik.isSubmitting}
                  >
                    <span>
                      {resetPasswordFormik.isSubmitting
                        ? "Actualizando..."
                        : "Actualizar contraseña"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={resetPasswordFormik.isSubmitting}
                    onClick={() => {
                      setCardView("forgot-password");
                      clearFeedback();
                      setPasswordRecoveryState(null);
                      resetPasswordFormik.resetForm();
                    }}
                  >
                    Volver atrás
                  </button>
                </form>
                {legalLinks}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}









