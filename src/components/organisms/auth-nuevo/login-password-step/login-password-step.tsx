"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import TextField from "@/components/atoms/text-field/text-field";
import AuthCard from "@/components/molecules/auth/auth-card/auth-card";
import {
  AuthNuevoError,
  guardarFlow,
  ingresarConContrasena,
  irDespuesDelIngreso,
  mensajeDeError,
} from "@/lib/auth-nuevo";
import { useAuthFlow } from "@/lib/use-auth-flow";
import styles from "./login-password-step.module.scss";

/** Paso 3a del ingreso: la contraseña. Si el navegador no es de confianza, sigue al código. */
export default function LoginPasswordStep() {
  const router = useRouter();
  const flow = useAuthFlow();
  const email = flow?.email;
  const recordar = flow?.recordar === true;
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<{ texto: string; sinConfirmar?: boolean } | null>(null);

  useEffect(() => {
    if (flow && !flow.email) router.replace("/ingresar");
  }, [flow, router]);

  const ingresar = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || enviando) return;
    if (!password) {
      setError({ texto: "Ingresá tu contraseña." });
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const result = await ingresarConContrasena(email, password, recordar);
      if (result.mfa_required && result.challenge) {
        guardarFlow({
          challenge: {
            id: result.challenge.challenge_id,
            destination: result.challenge.destination_masked,
            tipo: "mfa",
          },
        });
        router.push("/ingresar/codigo");
        return;
      }
      await irDespuesDelIngreso();
    } catch (err) {
      setError({
        texto: mensajeDeError(err),
        sinConfirmar: err instanceof AuthNuevoError && err.code === "AUTH_EMAIL_NOT_VERIFIED",
      });
      setEnviando(false);
    }
  };

  if (!email) return null;

  return (
    <AuthCard
      title="Ingresá tu contraseña"
      subtitle={email}
      onBack={() => router.push("/ingresar/metodo")}
    >
      <form className={styles.form} onSubmit={ingresar} noValidate>
        <input type="email" value={email} autoComplete="username" readOnly hidden />
        <TextField
          id="ingresar-password"
          label="Contraseña"
          labelAction={
            // Recuperar la contraseña sigue en el ingreso de siempre.
            <Link href="/?login=clasico" className={styles.link}>
              ¿Olvidaste tu contraseña?
            </Link>
          }
          type="password"
          autoComplete="current-password"
          placeholder="Ingresá tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && (
          <Alert color="warning">
            <span>{error.texto}</span>
            {error.sinConfirmar && (
              <Link
                href={`/registro?email=${encodeURIComponent(email)}`}
                className={styles.alertAction}
              >
                Confirmar mi email
              </Link>
            )}
          </Alert>
        )}
        <PortalButton
          type="submit"
          tone="socios"
          loading={enviando}
          icon={<LogIn size={20} />}
        >
          {enviando ? "Ingresando…" : "Ingresar"}
        </PortalButton>
      </form>
    </AuthCard>
  );
}
