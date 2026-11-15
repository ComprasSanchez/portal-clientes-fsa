"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import TextField from "@/components/atoms/text-field/text-field";
import AuthCard from "@/components/molecules/auth/auth-card/auth-card";
import { OtpCodeInput } from "@/components/molecules/input-otp/input-otp";
import {
  cambiarContrasenaConCodigo,
  formatoEspera,
  guardarFlow,
  mensajeDeError,
  pedirCodigoDeRecuperacion,
  segundosParaOtroCodigo,
  validarContrasenaNueva,
} from "@/lib/auth-nuevo";
import { useAuthFlow } from "@/lib/use-auth-flow";
import styles from "./recuperar-clave-step.module.scss";

/** "Olvidé mi contraseña", paso 2: el código del email y la contraseña nueva. */
export default function RecuperarClaveStep() {
  const router = useRouter();
  const flow = useAuthFlow();
  const email = flow?.email;
  const recuperacion = flow?.recuperacion;
  const [code, setCode] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  // Ya se cambió: no volver a pedir el código aunque se haya borrado del flujo.
  const cambiada = useRef(false);

  useEffect(() => {
    if (cambiada.current) return;
    if (flow && (!flow.email || !flow.recuperacion)) router.replace("/ingresar/recuperar");
  }, [flow, router]);

  const espera = recuperacion ? segundosParaOtroCodigo(recuperacion.pedidoAt, ahora) : 0;
  useEffect(() => {
    if (espera <= 0) return;
    const t = window.setTimeout(() => setAhora(Date.now()), 1000);
    return () => window.clearTimeout(t);
  }, [espera, ahora]);

  if (!email || !recuperacion) return null;

  const cambiar = async (e: FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    if (code.length !== 6) {
      setError("Ingresá el código de 6 dígitos que te mandamos.");
      return;
    }
    const invalida = validarContrasenaNueva(nueva, repetida);
    if (invalida) {
      setError(invalida);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await cambiarContrasenaConCodigo(recuperacion.challengeId, code, nueva);
      cambiada.current = true;
      guardarFlow({ recuperacion: undefined, claveCambiada: true });
      router.replace("/ingresar/contrasena");
    } catch (err) {
      setError(mensajeDeError(err));
      setCode("");
      setEnviando(false);
    }
  };

  const reenviar = async () => {
    if (espera > 0) return;
    setError(null);
    setAviso(null);
    try {
      const r = await pedirCodigoDeRecuperacion(email);
      if (!r.challenge?.id) throw new Error("sin código");
      guardarFlow({ recuperacion: { challengeId: r.challenge.id, pedidoAt: Date.now() } });
      setAhora(Date.now());
      setCode("");
      setAviso("Te mandamos un código nuevo.");
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  return (
    <AuthCard
      title="Elegí tu contraseña nueva"
      subtitle={
        <>
          Si hay una cuenta con {email}, te mandamos un código de 6 dígitos. Vence en 10 minutos.
        </>
      }
      onBack={() => router.push("/ingresar/recuperar")}
    >
      <form className={styles.form} onSubmit={cambiar} noValidate>
        <OtpCodeInput value={code} onChange={setCode} isInvalid={!!error && code.length !== 6} autoFocus />
        <input type="email" value={email} autoComplete="username" readOnly hidden />
        <TextField
          id="recuperar-nueva"
          label="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          hint="Al menos 8 caracteres."
          value={nueva}
          onChange={(e) => {
            setNueva(e.target.value);
            setError(null);
          }}
        />
        <TextField
          id="recuperar-repetida"
          label="Repetí la contraseña"
          type="password"
          autoComplete="new-password"
          value={repetida}
          onChange={(e) => {
            setRepetida(e.target.value);
            setError(null);
          }}
        />
        {error && <Alert color="warning">{error}</Alert>}
        {aviso && !error && <Alert color="success">{aviso}</Alert>}
        <PortalButton type="submit" tone="socios" loading={enviando} icon={<KeyRound size={20} />}>
          {enviando ? "Guardando…" : "Cambiar contraseña"}
        </PortalButton>
      </form>
      {espera > 0 ? (
        <p className={styles.countdown}>Podés pedir otro código en {formatoEspera(espera)}</p>
      ) : (
        <button type="button" className={styles.resend} onClick={() => void reenviar()}>
          Enviar otro código
        </button>
      )}
      <p className={styles.tip}>Si no lo ves, revisá la carpeta de correo no deseado.</p>
    </AuthCard>
  );
}
