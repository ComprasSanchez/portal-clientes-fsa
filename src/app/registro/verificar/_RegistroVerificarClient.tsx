"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CodigoStep from "@/components/organisms/auth-nuevo/codigo-step/codigo-step";
import {
  confirmarRegistro,
  guardarFlow,
  irDespuesDelIngreso,
  reenviarCodigoDeRegistro,
} from "@/lib/auth-nuevo";
import { useAuthFlow } from "@/lib/use-auth-flow";

/** Registro, paso 2: el código del email. Al confirmarlo queda la sesión iniciada. */
export function RegistroVerificarClient() {
  const router = useRouter();
  const flow = useAuthFlow();

  useEffect(() => {
    if (flow && !flow.registro) router.replace("/registro");
  }, [flow, router]);

  if (!flow?.registro) return null;
  const { registro } = flow;

  const confirmar = async (code: string) => {
    const r = await confirmarRegistro(registro.flowId, code, flow.recordar === true);
    if (r.session_started) {
      await irDespuesDelIngreso();
      return;
    }
    // La cuenta quedó creada pero no se pudo abrir la sesión: que ingrese con su email.
    guardarFlow({ registro: undefined });
    router.push("/ingresar/metodo");
  };

  const reenviar = async () => {
    const r = await reenviarCodigoDeRegistro(registro.flowId);
    guardarFlow({
      registro: { flowId: r.flow_id, destination: r.challenge.destination_masked },
    });
    return r.challenge.destination_masked;
  };

  return (
    <CodigoStep
      title="Confirmá tu email"
      destino={registro.destination}
      descripcion={(destino) =>
        `Te enviamos un código de 6 dígitos a ${destino}. Ingresalo para terminar de crear tu cuenta.`
      }
      onConfirm={confirmar}
      onResend={reenviar}
      onBack={() => router.push("/registro")}
    />
  );
}
