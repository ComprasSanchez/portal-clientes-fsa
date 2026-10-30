"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Checkbox from "@/components/atoms/checkbox/checkbox";
import CodigoStep from "@/components/organisms/auth-nuevo/codigo-step/codigo-step";
import {
  confirmarCodigoDeIngreso,
  confirmarCodigoPorEmail,
  guardarFlow,
  irDespuesDelIngreso,
  pedirCodigoPorEmail,
  reenviarCodigoDeIngreso,
} from "@/lib/auth-nuevo";
import { useAuthFlow } from "@/lib/use-auth-flow";

/**
 * Código de ingreso: el que se pide después de la contraseña (navegador nuevo)
 * o el de "ingresar con un código por email".
 */
export function IngresarCodigoClient() {
  const router = useRouter();
  const flow = useAuthFlow();
  const [recordarNavegador, setRecordarNavegador] = useState(true);

  useEffect(() => {
    if (flow && (!flow.email || !flow.challenge)) router.replace("/ingresar");
  }, [flow, router]);

  if (!flow?.challenge || !flow.email) return null;
  const { challenge, email } = flow;
  const recordar = flow.recordar === true;

  const confirmar = async (code: string) => {
    if (challenge.tipo === "mfa") {
      await confirmarCodigoDeIngreso(challenge.id, code, recordar, recordarNavegador);
    } else {
      await confirmarCodigoPorEmail(challenge.id, code, recordar);
    }
    await irDespuesDelIngreso();
  };

  const reenviar = async () => {
    const r =
      challenge.tipo === "mfa"
        ? await reenviarCodigoDeIngreso(challenge.id)
        : await pedirCodigoPorEmail(email);
    guardarFlow({
      challenge: {
        id: r.challenge.challenge_id,
        destination: r.challenge.destination_masked,
        tipo: challenge.tipo,
      },
      ...(challenge.tipo === "email" ? { codigoPedidoAt: Date.now() } : {}),
    });
    return r.challenge.destination_masked;
  };

  return (
    <CodigoStep
      title={challenge.tipo === "mfa" ? "Confirmá que sos vos" : "Revisá tu email"}
      destino={challenge.destination}
      pedidoAt={challenge.tipo === "email" ? flow.codigoPedidoAt : undefined}
      descripcion={(destino) =>
        challenge.tipo === "mfa"
          ? `Es la primera vez que entrás desde este navegador. Te enviamos un código de 6 dígitos a ${destino}.`
          : // El ingreso con código no revela si el email tiene cuenta.
            `Si ${destino} tiene una cuenta, te enviamos un código de 6 dígitos. Ingresalo para entrar.`
      }
      onConfirm={confirmar}
      onResend={reenviar}
      onBack={() =>
        router.push(challenge.tipo === "mfa" ? "/ingresar/contrasena" : "/ingresar/metodo")
      }
      extra={
        challenge.tipo === "mfa" ? (
          <Checkbox
            id="recordar-navegador"
            checked={recordarNavegador}
            onChange={setRecordarNavegador}
            label="No volver a pedir el código en este navegador"
            tone="socios"
          />
        ) : undefined
      }
    />
  );
}
