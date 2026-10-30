"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";
import AuthCard from "@/components/molecules/auth/auth-card/auth-card";
import { OtpCodeInput } from "@/components/molecules/input-otp/input-otp";
import {
  AuthNuevoError,
  ESPERA_ENTRE_CODIGOS_SEG,
  formatoEspera,
  mensajeDeError,
  segundosParaOtroCodigo,
} from "@/lib/auth-nuevo";
import styles from "./codigo-step.module.scss";

type CodigoStepProps = {
  title?: string;
  /** Email (enmascarado) al que se mandó el código. */
  destino: string;
  /** Texto debajo del título; recibe el destino. Sin valor: "Te enviamos un código…". */
  descripcion?: (destino: string) => ReactNode;
  /** Tira un error con el mensaje para el cliente si el código no sirve. */
  onConfirm: (code: string) => Promise<void>;
  /** Pide otro código; devuelve el destino nuevo si cambió. */
  onResend?: () => Promise<string | void>;
  onBack: () => void;
  /** Contenido extra arriba del botón (ej. "no volver a pedir el código"). */
  extra?: ReactNode;
  /** Cuándo se pidió el código (ms): la espera para reenviar cuenta desde ahí. Sin valor, un minuto entero. */
  pedidoAt?: number;
};

/** Paso de "ingresá el código de 6 dígitos que te mandamos por email". */
export default function CodigoStep({
  title = "Revisá tu email",
  destino,
  descripcion,
  onConfirm,
  onResend,
  onBack,
  extra,
  pedidoAt,
}: CodigoStepProps) {
  const [code, setCode] = useState("");
  const [destinoActual, setDestinoActual] = useState(destino);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [espera, setEspera] = useState(() =>
    pedidoAt ? segundosParaOtroCodigo(pedidoAt, Date.now()) : ESPERA_ENTRE_CODIGOS_SEG,
  );

  useEffect(() => {
    if (espera <= 0) return;
    const t = window.setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [espera]);

  const confirmar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (enviando || code.length !== 6) return;
    setEnviando(true);
    setError(null);
    try {
      await onConfirm(code);
    } catch (err) {
      setError(mensajeDeError(err));
      setCode("");
      setEnviando(false);
    }
  };

  const reenviar = async () => {
    if (!onResend || espera > 0) return;
    setError(null);
    setAviso(null);
    try {
      const nuevo = await onResend();
      if (nuevo) setDestinoActual(nuevo);
      setAviso("Te mandamos un código nuevo.");
      setEspera(ESPERA_ENTRE_CODIGOS_SEG);
    } catch (err) {
      // Si todavía no se puede pedir otro, se muestra cuánto falta en vez de un error.
      if (err instanceof AuthNuevoError && err.retryAfterSec) {
        setEspera(err.retryAfterSec);
      } else {
        setError(mensajeDeError(err));
      }
    }
  };

  return (
    <AuthCard
      title={title}
      subtitle={
        descripcion ? (
          descripcion(destinoActual)
        ) : (
          <>Te enviamos un código de 6 dígitos a {destinoActual}. Ingresalo para entrar.</>
        )
      }
      onBack={onBack}
    >
      <form className={styles.form} onSubmit={confirmar} noValidate>
        <OtpCodeInput value={code} onChange={setCode} isInvalid={!!error} autoFocus />
        {error && <Alert color="warning">{error}</Alert>}
        {aviso && !error && <Alert color="success">{aviso}</Alert>}
        {extra}
        <PortalButton
          type="submit"
          tone="socios"
          loading={enviando}
          disabled={code.length !== 6}
          icon={<ShieldCheck size={20} />}
        >
          {enviando ? "Verificando…" : "Verificar"}
        </PortalButton>
      </form>
      {onResend &&
        (espera > 0 ? (
          <p className={styles.countdown}>
            Podés pedir otro código en {formatoEspera(espera)}
          </p>
        ) : (
          <button type="button" className={styles.resend} onClick={() => void reenviar()}>
            Enviar otro código
          </button>
        ))}
      <p className={styles.tip}>Si no lo ves, revisá la carpeta de correo no deseado.</p>
    </AuthCard>
  );
}
