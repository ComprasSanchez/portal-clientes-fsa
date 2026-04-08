"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { InputOTP } from "@heroui/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useFormik } from "formik";
import { Check, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import * as Yup from "yup";
import googleLogo from "@/assets/google-logo.svg";
import mobileLogo from "@/assets/logo-celeste.png";
import loginLogo from "@/assets/farmacia-logo.svg";
import styles from "./login.module.scss";
import { InputMFA } from "@/components/molecules/input-otp/input-otp";
import {
  AuthCardView,
  ForgotPasswordFormValues,
  ForgotPasswordResponse,
  LoginFormValues,
  LoginProps,
  LoginResponse,
  MfaState,
  PasswordRecoveryState,
  RegisterFormValues,
  ResetPasswordFormValues,
} from "@/types/login";
import { getErrorMessage } from "@/helpers/error-message";
import { getSafeRedirectPath } from "@/lib/auth";

const BENEFITS = [
  "Acceso rápido a tus envíos de datos",
  "Reportes y estadísticas en tiempo real",
  "Gestión simplificada de tus entregas",
];

const loginValidationSchema = Yup.object({
  username: Yup.string().trim().required("Ingresá tu usuario."),
  password: Yup.string().required("Ingresá tu contraseña."),
});

const registerValidationSchema = Yup.object({
  username: Yup.string().trim().required("Ingresá un usuario."),
  email: Yup.string().trim().email("Ingresá un email válido.").required("Ingresá un email."),
  password: Yup.string().min(8, "La contraseña debe tener al menos 8 caracteres.").required("Ingresá una contraseña."),
  firstName: Yup.string().trim().required("Ingresá tu nombre."),
  lastName: Yup.string().trim().required("Ingresá tu apellido."),
});

const verifyEmailValidationSchema = Yup.object({
  email: Yup.string().trim().email("Ingresá un email válido.").required("Ingresá un email."),
});

const forgotPasswordValidationSchema = Yup.object({
  identifier: Yup.string().trim().email("Ingresá un email válido.").required("Ingresá un email."),
});

const resetPasswordValidationSchema = Yup.object({
  code: Yup.string().trim().length(6, "Ingresá el código de 6 dígitos.").required("Ingresá el código de verificación."),
  newPassword: Yup.string().min(8, "La contraseña debe tener al menos 8 caracteres.").required("Ingresá una nueva contraseña."),
});

export function Login({ onLogin }: LoginProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cardView, setCardView] = useState<AuthCardView>("login");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [mfaState, setMfaState] = useState<MfaState | null>(null);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [resendEmailTarget, setResendEmailTarget] = useState<string | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [shouldPromptVerifyEmail, setShouldPromptVerifyEmail] = useState(false);
  const [hideEmailResendActions, setHideEmailResendActions] = useState(false);
  const [hasProcessedVerificationToken, setHasProcessedVerificationToken] = useState(false);
  const [hasProcessedGoogleAuthError, setHasProcessedGoogleAuthError] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [passwordRecoveryState, setPasswordRecoveryState] = useState<PasswordRecoveryState | null>(null);

  const getErrorCode = (payload: LoginResponse | null) => {
    if (payload && typeof payload.error === "object" && payload.error !== null && "code" in payload.error) {
      return payload.error.code ?? null;
    }

    if (typeof payload?.error === "string") {
      return payload.error;
    }

    return null;
  };

  const getErrorDetailEmail = (payload: LoginResponse | null) => {
    if (payload && typeof payload.error === "object" && payload.error !== null && "details" in payload.error) {
      return payload.error.details?.email ?? null;
    }

    return null;
  };

  const getResendEmailFromInput = (candidate: string) => {
    const normalizedValue = candidate.trim();
    return normalizedValue.includes("@") ? normalizedValue : null;
  };

  const handleResendVerificationEmail = async () => {
    if (!resendEmailTarget) {
      return;
    }

    setIsResendingEmail(true);

    try {
      await axios.post(
        "/api/auth/verify-email/resend",
        {
          email: resendEmailTarget,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      setErrorMessage(null);
      setInfoMessage(`Te reenviamos el email de verificación a ${resendEmailTarget}.`);
      setHideEmailResendActions(true);
    } catch (error) {
      if (axios.isAxiosError<LoginResponse>(error)) {
        setErrorMessage(
          getErrorMessage(
            error.response?.data ?? null,
            "No pudimos reenviar el email de verificación. Intentá nuevamente.",
          ),
        );
      } else {
        setErrorMessage("No pudimos reenviar el email de verificación. Intentá nuevamente.");
      }
    } finally {
      setIsResendingEmail(false);
    }
  };

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token || hasProcessedVerificationToken) {
      return;
    }

    const verifyEmailByToken = async () => {
      setHasProcessedVerificationToken(true);
      setCardView("login");
      setErrorMessage(null);
      setInfoMessage(null);
      setResendEmailTarget(null);
      setShouldPromptVerifyEmail(false);
      setHideEmailResendActions(false);

      try {
        await axios.post(
          "/api/auth/verify-email",
          {
            token,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        setInfoMessage("Tu email fue validado correctamente. Ahora podés iniciar sesión normalmente.");
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
              "No pudimos validar tu email. Solicitá un nuevo enlace de verificación.",
            ),
          );
        } else {
          setErrorMessage("No pudimos validar tu email. Solicitá un nuevo enlace de verificación.");
        }
      } finally {
        const nextSearchParams = new URLSearchParams(searchParams.toString());
        nextSearchParams.delete("token");
        const nextQuery = nextSearchParams.toString();
        router.replace(nextQuery ? `/?${nextQuery}` : "/");
      }
    };

    void verifyEmailByToken();
  }, [hasProcessedVerificationToken, router, searchParams]);

  useEffect(() => {
    const googleAuthError = searchParams.get("googleAuthError");

    if (!googleAuthError || hasProcessedGoogleAuthError) {
      return;
    }

    setHasProcessedGoogleAuthError(true);
    setErrorMessage("No pudimos completar el inicio de sesión con Google. Intentá nuevamente.");

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("googleAuthError");
    const nextQuery = nextSearchParams.toString();
    router.replace(nextQuery ? `/?${nextQuery}` : "/");
  }, [hasProcessedGoogleAuthError, router, searchParams]);

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: loginValidationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      setErrorMessage(null);
      setInfoMessage(null);
      setMfaState(null);
      setResendEmailTarget(null);
      setShouldPromptVerifyEmail(false);
      setHideEmailResendActions(false);

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
            setCardView("mfa");
            return;
          } catch (challengeError: unknown) {
            if (axios.isAxiosError<LoginResponse>(challengeError)) {
              setErrorMessage(getErrorMessage(challengeError.response?.data ?? null, "No pudimos iniciar el challenge MFA."));
            } else {
              setErrorMessage("No pudimos iniciar el challenge MFA.");
            }
            return;
          }
        }

        onLogin?.(values.username, values.password);

        const redirectTo = getSafeRedirectPath(searchParams.get("redirectTo"));
        router.push(redirectTo);
        router.refresh();
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          const payload = error.response?.data ?? null;
          const errorCode = getErrorCode(payload);
          const errorEmail = getErrorDetailEmail(payload);

          if (errorCode === "AUTH_EMAIL_NOT_VERIFIED") {
            const resendCandidate = errorEmail ?? getResendEmailFromInput(values.username);

            if (resendCandidate) {
              setResendEmailTarget(resendCandidate);
              setHideEmailResendActions(false);
            } else {
              setShouldPromptVerifyEmail(true);
              setHideEmailResendActions(false);
            }
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

  const registerFormik = useFormik<RegisterFormValues>({
    initialValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
    validationSchema: registerValidationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      setErrorMessage(null);
      setInfoMessage(null);
      setResendEmailTarget(null);
      setShouldPromptVerifyEmail(false);
      setHideEmailResendActions(false);

      try {
        await axios.post<LoginResponse>(
          "/api/auth/register",
          {
            username: values.username,
            email: values.email,
            password: values.password,
            firstName: values.firstName,
            lastName: values.lastName,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        helpers.resetForm();
        setCardView("login");
        setInfoMessage("Te enviamos un correo electrónico para verificar tu email.");
        setResendEmailTarget(values.email);
        setHideEmailResendActions(false);
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          const payload = error.response?.data ?? null;
          const errorCode = getErrorCode(payload);

          if (errorCode === "AUTH_REGISTER_EMAIL_SEND_FAILED") {
            setResendEmailTarget(values.email);
            setHideEmailResendActions(false);
          }

          setErrorMessage(
            getErrorMessage(
              payload,
              "No pudimos crear tu cuenta. Revisá los datos e intentá nuevamente.",
            ),
          );
        } else {
          setErrorMessage("No pudimos conectar con el servicio de registro. Intentá nuevamente.");
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
      setErrorMessage(null);
      setInfoMessage(null);

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

        setInfoMessage(data.message && typeof data.message === "string" ? data.message : "Si la cuenta existe, enviaremos instrucciones de recuperación al canal configurado.");
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
              "No pudimos iniciar la recuperación de contraseña. Intentá nuevamente.",
            ),
          );
        } else {
          setErrorMessage("No pudimos iniciar la recuperación de contraseña. Intentá nuevamente.");
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
        setErrorMessage("No encontramos una solicitud activa para restablecer la contraseña.");
        helpers.setSubmitting(false);
        return;
      }

      setErrorMessage(null);
      setInfoMessage(null);

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
        setInfoMessage("Tu contraseña fue actualizada correctamente. Iniciá sesión con la nueva clave.");
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
              "No pudimos restablecer tu contraseña. Verificá el código e intentá nuevamente.",
            ),
          );
        } else {
          setErrorMessage("No pudimos restablecer tu contraseña. Intentá nuevamente.");
        }
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const verifyEmailFormik = useFormik<{ email: string }>({
    initialValues: {
      email: "",
    },
    validationSchema: verifyEmailValidationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      setErrorMessage(null);
      setInfoMessage(null);
      setIsResendingEmail(true);
      setHideEmailResendActions(false);

      try {
        await axios.post(
          "/api/auth/verify-email/resend",
          {
            email: values.email,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        setCardView("login");
        setShouldPromptVerifyEmail(false);
        setResendEmailTarget(values.email);
        setInfoMessage(`Te reenviamos el email de verificación a ${values.email}.`);
        setHideEmailResendActions(true);
        helpers.resetForm();
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
              "No pudimos reenviar el email de verificación. Intentá nuevamente.",
            ),
          );
        } else {
          setErrorMessage("No pudimos reenviar el email de verificación. Intentá nuevamente.");
        }
      } finally {
        setIsResendingEmail(false);
        helpers.setSubmitting(false);
      }
    },
  });

  const usernameHasError = Boolean(
    formik.touched.username && formik.errors.username,
  );
  const passwordHasError = Boolean(
    formik.touched.password && formik.errors.password,
  );
  const registerUsernameHasError = Boolean(
    registerFormik.touched.username && registerFormik.errors.username,
  );
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
  const verifyEmailHasError = Boolean(
    verifyEmailFormik.touched.email && verifyEmailFormik.errors.email,
  );
  const forgotPasswordHasError = Boolean(
    forgotPasswordFormik.touched.identifier && forgotPasswordFormik.errors.identifier,
  );
  const resetPasswordCodeHasError = Boolean(
    resetPasswordFormik.touched.code && resetPasswordFormik.errors.code,
  );
  const resetPasswordHasError = Boolean(
    resetPasswordFormik.touched.newPassword && resetPasswordFormik.errors.newPassword,
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
                {errorMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackError}`}>
                    {errorMessage}
                  </div>
                ) : null}
                {resendEmailTarget && !hideEmailResendActions ? (
                  <div className={styles.feedbackActions}>
                    <button
                      type="button"
                      className={styles.resendButton}
                      onClick={handleResendVerificationEmail}
                      disabled={isResendingEmail}
                    >
                      {isResendingEmail ? "Reenviando..." : "Reenviar email"}
                    </button>
                  </div>
                ) : shouldPromptVerifyEmail && !hideEmailResendActions ? (
                  <div className={styles.feedbackActions}>
                    <button
                      type="button"
                      className={styles.resendButton}
                      onClick={() => {
                        setCardView("verify-email");
                        setInfoMessage(null);
                      }}
                    >
                      Validar email
                    </button>
                  </div>
                ) : null}
                <form
                  onSubmit={formik.handleSubmit}
                  className={styles.form}
                  noValidate
                >
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="login-email">
                      Usuario
                    </label>
                    <input
                      id="login-email"
                      name="username"
                      type="email"
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
                          setErrorMessage(null);
                          setInfoMessage(null);
                          setResendEmailTarget(null);
                          setShouldPromptVerifyEmail(false);
                          setHideEmailResendActions(false);
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
                        onClick={() => setShowLoginPassword((currentValue) => !currentValue)}
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
                      setErrorMessage(null);
                      setInfoMessage(null);
                      setResendEmailTarget(null);
                      setShouldPromptVerifyEmail(false);
                      setHideEmailResendActions(false);
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
                  onClick={() => {
                    const redirectTo = getSafeRedirectPath(searchParams.get("redirectTo"));
                    window.location.assign(`/api/auth/providers/google/start?redirectTo=${encodeURIComponent(redirectTo)}`);
                  }}
                  className={styles.googleButton}
                  disabled={formik.isSubmitting}
                >
                  <Image src={googleLogo} alt="Google" width={20} height={20} />
                  <span>Continuar con Google</span>
                </button>
                <div className={styles.legalLinks}>
                  <a href="#" className={styles.inlineLink}>
                    Términos de uso
                  </a>
                  {" · "}
                  <a href="#" className={styles.inlineLink}>
                    Política de privacidad
                  </a>
                </div>
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
                  <h2 className={styles.formTitle}>Crear perfil</h2>
                  <p className={styles.formSubtitle}>Completá tus datos para registrarte</p>
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
                {resendEmailTarget && !hideEmailResendActions ? (
                  <div className={styles.feedbackActions}>
                    <button
                      type="button"
                      className={styles.resendButton}
                      onClick={handleResendVerificationEmail}
                      disabled={isResendingEmail}
                    >
                      {isResendingEmail ? "Reenviando..." : "Reenviar email"}
                    </button>
                  </div>
                ) : null}
                <form onSubmit={registerFormik.handleSubmit} className={styles.form} noValidate>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="register-username">
                        Usuario
                      </label>
                      <input
                        id="register-username"
                        name="username"
                        type="text"
                        placeholder="Elegí un usuario"
                        value={registerFormik.values.username}
                        onChange={registerFormik.handleChange}
                        onBlur={registerFormik.handleBlur}
                        autoComplete="username"
                        className={`${styles.input} ${registerUsernameHasError ? styles.inputError : ""}`}
                      />
                      {registerUsernameHasError ? (
                        <p className={styles.fieldError}>{registerFormik.errors.username}</p>
                      ) : null}
                    </div>
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
                        onClick={() => setShowRegisterPassword((currentValue) => !currentValue)}
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
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={registerFormik.isSubmitting}
                  >
                    <UserPlus size={20} />
                    <span>{registerFormik.isSubmitting ? "Creando perfil..." : "Crear perfil"}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={registerFormik.isSubmitting}
                    onClick={() => {
                      setCardView("login");
                      setErrorMessage(null);
                      setInfoMessage(null);
                      setResendEmailTarget(null);
                      setShouldPromptVerifyEmail(false);
                      setHideEmailResendActions(false);
                      registerFormik.resetForm();
                    }}
                  >
                    Volver atrás
                  </button>
                </form>
                <div className={styles.legalLinks}>
                  <a href="#" className={styles.inlineLink}>
                    Términos de uso
                  </a>
                  {" · "}
                  <a href="#" className={styles.inlineLink}>
                    Política de privacidad
                  </a>
                </div>
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
                  <h2 className={styles.formTitle}>Validación MFA</h2>
                  <p className={styles.formSubtitle}>
                    Ingresá el código enviado por {mfaState?.challengeChannel || "tu canal seleccionado"}.
                  </p>
                </header>
                {errorMessage ? (
                  <div className={`${styles.feedback} ${styles.feedbackError}`}>
                    {errorMessage}
                  </div>
                ) : null}
                <InputMFA
                  key={mfaState?.loginTicket}
                  onSubmit={async (code: string, rememberDevice: boolean) => {
                    setIsVerifyingMfa(true);
                    setErrorMessage(null);
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
                        // MFA OK, redirigir
                        onLogin?.(formik.values.username, formik.values.password);
                        const redirectTo = getSafeRedirectPath(searchParams.get("redirectTo"));
                        router.push(redirectTo);
                        router.refresh();
                        return;
                      }
                      // Si falla, solo mostrar error y mantener el paso OTP
                      setErrorMessage(getErrorMessage(data, "No pudimos validar el código. Intentá nuevamente."));
                    } catch (error) {
                      if (axios.isAxiosError<LoginResponse>(error)) {
                        setErrorMessage(getErrorMessage(error.response?.data ?? null, "No pudimos validar el código. Intentá nuevamente."));
                      } else {
                        setErrorMessage("No pudimos conectar con el servicio de autenticación. Intentá nuevamente.");
                      }
                    } finally {
                      setIsVerifyingMfa(false);
                    }
                  }}
                  isLoading={isVerifyingMfa}
                />
                <button
                  type="button"
                  className={styles.secondaryButton}
                  style={{ marginTop: 16 }}
                  onClick={() => {
                    setCardView("login");
                    setMfaState(null);
                    setErrorMessage(null);
                    setInfoMessage(null);
                    setResendEmailTarget(null);
                    setShouldPromptVerifyEmail(false);
                    setHideEmailResendActions(false);
                  }}
                >
                  Volver atrás
                </button>
                <div className={styles.legalLinks}>
                  <a href="#" className={styles.inlineLink}>
                    Términos de uso
                  </a>
                  {" · "}
                  <a href="#" className={styles.inlineLink}>
                    Política de privacidad
                  </a>
                </div>
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
                  <p className={styles.formSubtitle}>Ingresá tu email para recibir el código de verificación</p>
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
                    <span>{forgotPasswordFormik.isSubmitting ? "Enviando..." : "Enviar código"}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={forgotPasswordFormik.isSubmitting}
                    onClick={() => {
                      setCardView("login");
                      setErrorMessage(null);
                      setInfoMessage(null);
                      setPasswordRecoveryState(null);
                      forgotPasswordFormik.resetForm();
                    }}
                  >
                    Volver atrás
                  </button>
                </form>
                <div className={styles.legalLinks}>
                  <a href="#" className={styles.inlineLink}>
                    Términos de uso
                  </a>
                  {" · "}
                  <a href="#" className={styles.inlineLink}>
                    Política de privacidad
                  </a>
                </div>
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
                      <InputOTP
                        aria-describedby={resetPasswordCodeHasError ? "reset-password-code-error" : undefined}
                        isInvalid={resetPasswordCodeHasError}
                        maxLength={6}
                        name="code"
                        value={resetPasswordFormik.values.code}
                        onChange={(value) => {
                          void resetPasswordFormik.setFieldValue("code", value);
                        }}
                      >
                        <InputOTP.Group>
                          <InputOTP.Slot index={0} />
                          <InputOTP.Slot index={1} />
                          <InputOTP.Slot index={2} />
                        </InputOTP.Group>
                        <InputOTP.Separator />
                        <InputOTP.Group>
                          <InputOTP.Slot index={3} />
                          <InputOTP.Slot index={4} />
                          <InputOTP.Slot index={5} />
                        </InputOTP.Group>
                      </InputOTP>
                    </div>
                    {resetPasswordCodeHasError ? (
                      <p className={styles.fieldError} id="reset-password-code-error">{resetPasswordFormik.errors.code}</p>
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
                        onClick={() => setShowResetPassword((currentValue) => !currentValue)}
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
                    <span>{resetPasswordFormik.isSubmitting ? "Actualizando..." : "Actualizar contraseña"}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={resetPasswordFormik.isSubmitting}
                    onClick={() => {
                      setCardView("forgot-password");
                      setErrorMessage(null);
                      setInfoMessage(null);
                      setPasswordRecoveryState(null);
                      resetPasswordFormik.resetForm();
                    }}
                  >
                    Volver atrás
                  </button>
                </form>
                <div className={styles.legalLinks}>
                  <a href="#" className={styles.inlineLink}>
                    Términos de uso
                  </a>
                  {" · "}
                  <a href="#" className={styles.inlineLink}>
                    Política de privacidad
                  </a>
                </div>
              </motion.div>
            ) : null}

            {cardView === "verify-email" ? (
              <motion.div
                key="verify-email-form"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -32 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
              >
                <header className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Validar email</h2>
                  <p className={styles.formSubtitle}>Ingresá tu email para reenviar la verificación</p>
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
                <form onSubmit={verifyEmailFormik.handleSubmit} className={styles.form} noValidate>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="verify-email-address">
                      Email
                    </label>
                    <input
                      id="verify-email-address"
                      name="email"
                      type="email"
                      placeholder="Ingresá tu email"
                      value={verifyEmailFormik.values.email}
                      onChange={verifyEmailFormik.handleChange}
                      onBlur={verifyEmailFormik.handleBlur}
                      autoComplete="email"
                      className={`${styles.input} ${verifyEmailHasError ? styles.inputError : ""}`}
                    />
                    {verifyEmailHasError ? (
                      <p className={styles.fieldError}>{verifyEmailFormik.errors.email}</p>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={verifyEmailFormik.isSubmitting || isResendingEmail}
                  >
                    <span>{isResendingEmail ? "Enviando..." : "Enviar verificación"}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={verifyEmailFormik.isSubmitting || isResendingEmail}
                    onClick={() => {
                      setCardView("login");
                      setErrorMessage(null);
                      setInfoMessage(null);
                      setShouldPromptVerifyEmail(false);
                      setHideEmailResendActions(false);
                      verifyEmailFormik.resetForm();
                    }}
                  >
                    Volver atrás
                  </button>
                </form>
                <div className={styles.legalLinks}>
                  <a href="#" className={styles.inlineLink}>
                    Términos de uso
                  </a>
                  {" · "}
                  <a href="#" className={styles.inlineLink}>
                    Política de privacidad
                  </a>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
