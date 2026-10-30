"use client";

import { QrCode, ScanLine } from "lucide-react";
import PortalButton from "@/components/atoms/button/button";
import Card from "@/components/atoms/card/card";
import { isEventoStandsActivo } from "@/lib/evento-stands";
import { type UiTone } from "@/types/ui-tone";
import styles from "./evento-stands-card.module.scss";

type EventoStandsCardProps = {
  onOpen: () => void;
  tone?: UiTone;
  className?: string;
};

/** Acceso al juego de stands del evento desde el Inicio. Solo mientras el evento está activo. */
export default function EventoStandsCard({
  onOpen,
  tone = "socios",
  className = "",
}: EventoStandsCardProps) {
  if (!isEventoStandsActivo()) return null;

  return (
    <Card tone={tone} className={`${styles.card} ${className}`}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden>
          <QrCode size={26} />
        </span>
        <div className={styles.copy}>
          <p className={styles.title}>Juego de stands Breve</p>
          <p className={styles.text}>
            Escaneá el QR de los stands del evento y retirá tu premio.
          </p>
        </div>
      </div>
      <PortalButton tone={tone} icon={<ScanLine size={20} />} onClick={onOpen}>
        Ver mis stands
      </PortalButton>
    </Card>
  );
}
