"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ShieldCheck, Store, UserRoundPlus } from "lucide-react";
import PortalButton from "@/components/atoms/button/button";
import Card from "@/components/atoms/card/card";
import type { IdentidadStatus } from "@/lib/auth-nuevo";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./identity-gate.module.scss";

type IdentityGateProps = {
  status: IdentidadStatus;
  /** Qué se va a poder ver al validar (ej. "tus pedidos"). */
  motivo: string;
  tone?: UiTone;
};

/**
 * Cuenta sin vincular a su DNI (modo limitado): en lugar de los datos, explica
 * qué falta y lleva a validar la identidad o completar el alta. Al terminar
 * vuelve a esta misma pantalla.
 */
export default function IdentityGate({ status, motivo, tone = "socios" }: IdentityGateProps) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const volverA = `${pathname}${query ? `?${query}` : ""}`;
  const irAValidar = () =>
    window.location.assign(`/validar-identidad?redirectTo=${encodeURIComponent(volverA)}`);

  const contenido =
    status === "ONBOARDING_REQUIRED"
      ? {
          Icono: UserRoundPlus,
          titulo: "Completá tu alta",
          texto: `Necesitamos tu nombre y tu DNI para mostrarte ${motivo}.`,
          boton: "Completar mi alta",
        }
      : status === "UNAVAILABLE"
        ? {
            Icono: Store,
            titulo: "Acercate a una sucursal",
            texto: `Para ver ${motivo} necesitamos validar tu identidad. Acercate a cualquier sucursal con tu DNI y te ayudamos.`,
            boton: null,
          }
        : {
            Icono: ShieldCheck,
            titulo: "Validá tu identidad",
            texto: `Ya tenemos tus datos como cliente. Confirmá que sos vos para ver ${motivo}.`,
            boton: "Validar mi identidad",
          };
  const { Icono } = contenido;

  return (
    <Card tone={tone} padding="lg" className={`${styles.card} ${toneClass(tone)}`}>
      <span className={styles.icon} aria-hidden>
        <Icono size={28} />
      </span>
      <h2 className={styles.title}>{contenido.titulo}</h2>
      <p className={styles.text}>{contenido.texto}</p>
      {contenido.boton && (
        <div className={styles.action}>
          <PortalButton tone={tone} onClick={irAValidar}>
            {contenido.boton}
          </PortalButton>
        </div>
      )}
    </Card>
  );
}
