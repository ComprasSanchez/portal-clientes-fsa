"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import Checkbox from "@/components/atoms/checkbox/checkbox";
import AuthCard from "@/components/molecules/auth/auth-card/auth-card";
import MetodoOption from "@/components/molecules/auth/metodo-option/metodo-option";
import {
  AuthNuevoError,
  ESPERA_ENTRE_CODIGOS_SEG,
  formatoEspera,
  guardarFlow,
  mensajeDeError,
  pedirCodigoPorEmail,
} from "@/lib/auth-nuevo";
import { useAuthFlow } from "@/lib/use-auth-flow";
import { useSegundosRestantes } from "@/lib/use-segundos-restantes";
import styles from "./login-metodo-step.module.scss";

/** Paso 2 del ingreso: contraseña o código por email, y "mantener la sesión iniciada". */
export default function LoginMetodoStep() {
  const router = useRouter();
  const flow = useAuthFlow();
  const email = flow?.email;
  const recordar = flow?.recordar === true;
  const [pidiendo, setPidiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Hay que esperar un minuto entre códigos: mientras tanto, se usa el que ya llegó.
  const espera = useSegundosRestantes(
    flow?.codigoPedidoAt ? flow.codigoPedidoAt + ESPERA_ENTRE_CODIGOS_SEG * 1000 : undefined,
  );
  const codigoVigente = espera > 0 && flow?.challenge?.tipo === "email";

  useEffect(() => {
    if (flow && !flow.email) router.replace("/ingresar");
  }, [flow, router]);

  const cambiarRecordar = (value: boolean) => {
    guardarFlow({ recordar: value });
  };

  const conCodigo = async () => {
    if (!email) return;
    if (codigoVigente) {
      router.push("/ingresar/codigo");
      return;
    }
    setPidiendo(true);
    setError(null);
    try {
      const { challenge } = await pedirCodigoPorEmail(email);
      guardarFlow({
        challenge: {
          id: challenge.challenge_id,
          destination: challenge.destination_masked,
          tipo: "email",
        },
        codigoPedidoAt: Date.now(),
      });
      router.push("/ingresar/codigo");
    } catch (err) {
      if (err instanceof AuthNuevoError && err.retryAfterSec) {
        // El servidor dice cuánto falta: la cuenta regresiva arranca desde ahí.
        guardarFlow({
          codigoPedidoAt:
            Date.now() - (ESPERA_ENTRE_CODIGOS_SEG - err.retryAfterSec) * 1000,
        });
      } else {
        setError(mensajeDeError(err));
      }
      setPidiendo(false);
    }
  };

  const textoCodigo = pidiendo
    ? "Enviando el código…"
    : espera > 0
      ? codigoVigente
        ? `Ya te enviamos un código. Podés pedir otro en ${formatoEspera(espera)}`
        : `Podés pedir un código en ${formatoEspera(espera)}`
      : "Te enviamos un código a tu email.";

  if (!email) return null;

  return (
    <AuthCard
      title="¿Cómo querés ingresar?"
      subtitle={
        <>
          {email}{" "}
          <button type="button" className={styles.change} onClick={() => router.push("/ingresar")}>
            Cambiar
          </button>
        </>
      }
      onBack={() => router.push("/ingresar")}
    >
      <div className={styles.options}>
        <MetodoOption
          icon={<KeyRound size={22} />}
          title="Contraseña"
          text="Ingresás tu contraseña."
          onClick={() => router.push("/ingresar/contrasena")}
          tone="socios"
        />
        <MetodoOption
          icon={<Mail size={22} />}
          title="Código por email"
          text={textoCodigo}
          onClick={() => void conCodigo()}
          disabled={pidiendo || (espera > 0 && !codigoVigente)}
          tone="socios"
        />
      </div>
      {error && <Alert color="warning">{error}</Alert>}
      <Checkbox
        id="recordar-sesion"
        checked={recordar}
        onChange={cambiarRecordar}
        label="Mantener la sesión iniciada por 30 días"
        hint="No lo marques en una computadora compartida."
        tone="socios"
      />
    </AuthCard>
  );
}
