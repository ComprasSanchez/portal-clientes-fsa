"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import TextField from "@/components/atoms/text-field/text-field";
import AuthCard from "@/components/molecules/auth/auth-card/auth-card";
import {
  emailValido,
  guardarFlow,
  mensajeDeError,
  pedirCodigoDeRecuperacion,
} from "@/lib/auth-nuevo";
import { useAuthFlow } from "@/lib/use-auth-flow";
import styles from "./recuperar-email-step.module.scss";

/** "Olvidé mi contraseña", paso 1: el email al que mandamos el código. */
export default function RecuperarEmailStep() {
  const router = useRouter();
  const flow = useAuthFlow();
  const [email, setEmail] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Arranca con el email que ya escribió en el ingreso.
  const valor = email ?? flow?.email ?? "";

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    if (!emailValido(valor)) {
      setError("Ingresá un email válido.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const r = await pedirCodigoDeRecuperacion(valor);
      if (!r.challenge?.id) throw new Error("sin código");
      guardarFlow({
        email: valor.trim().toLowerCase(),
        recuperacion: { challengeId: r.challenge.id, pedidoAt: Date.now() },
      });
      router.push("/ingresar/recuperar/nueva");
    } catch (err) {
      setError(mensajeDeError(err));
      setEnviando(false);
    }
  };

  return (
    <AuthCard
      title="Recuperá tu contraseña"
      subtitle="Te mandamos un código a tu email para que elijas una contraseña nueva."
      onBack={() => router.push(flow?.email ? "/ingresar/contrasena" : "/ingresar")}
    >
      <form className={styles.form} onSubmit={enviar} noValidate>
        <TextField
          id="recuperar-email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="tu@email.com"
          value={valor}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          autoFocus
        />
        {error && <Alert color="warning">{error}</Alert>}
        <PortalButton type="submit" tone="socios" loading={enviando} icon={<Mail size={20} />}>
          {enviando ? "Enviando…" : "Enviarme el código"}
        </PortalButton>
      </form>
    </AuthCard>
  );
}
