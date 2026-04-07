"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useFormik } from "formik";
import { Check, LogIn, UserPlus } from "lucide-react";
import * as Yup from "yup";
import googleLogo from "@/assets/google-logo.svg";
import mobileLogo from "@/assets/logo-celeste.png";
import loginLogo from "@/assets/farmacia-logo.svg";
import styles from "./login.module.scss";
import { InputMFA } from "@/components/molecules/input-otp/input-otp";
import {
  AuthCardView,
  LoginFormValues,
  LoginProps,
  LoginResponse,
  MfaState,
  RegisterFormValues,
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

export function Login({ onLogin }: LoginProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cardView, setCardView] = useState<AuthCardView>("login");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [mfaState, setMfaState] = useState<MfaState | null>(null);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

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
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
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
        setInfoMessage("Cuenta creada correctamente. Ya podés iniciar sesión.");
      } catch (error) {
        if (axios.isAxiosError<LoginResponse>(error)) {
          setErrorMessage(
            getErrorMessage(
              error.response?.data ?? null,
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
                      <a href="#" className={styles.inlineLink}>
                        ¿Olvidaste tu contraseña?
                      </a>
                    </div>
                    <input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="Ingresá tu contraseña"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      autoComplete="current-password"
                      required
                      className={`${styles.input} ${passwordHasError ? styles.inputError : ""}`}
                    />
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
                    console.log("Iniciar sesión con Google");
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
                    <input
                      id="register-password"
                      name="password"
                      type="password"
                      placeholder="Creá una contraseña"
                      value={registerFormik.values.password}
                      onChange={registerFormik.handleChange}
                      onBlur={registerFormik.handleBlur}
                      autoComplete="new-password"
                      className={`${styles.input} ${registerPasswordHasError ? styles.inputError : ""}`}
                    />
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
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
