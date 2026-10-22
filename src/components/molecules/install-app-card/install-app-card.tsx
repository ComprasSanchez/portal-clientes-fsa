"use client";

import Image from "next/image";
import { Share, SquarePlus, X } from "lucide-react";
import Card from "@/components/atoms/card/card";
import { useInstallApp } from "@/lib/use-install-app";
import { type UiTone } from "@/types/ui-tone";
import styles from "./install-app-card.module.scss";

// En `next dev` también se ve en escritorio, para poder probarla sin celular.
const MOBILE_ONLY = process.env.NODE_ENV !== "development";

type InstallAppCardProps = {
  tone?: UiTone;
  className?: string;
};

/**
 * Invita a agregar el portal como acceso directo en la pantalla de inicio del celular.
 * Solo se ve en celular/tablet (salvo en desarrollo), y nunca si ya está instalado o lo
 * cerraron hace poco.
 */
export default function InstallAppCard({ tone = "socios", className = "" }: InstallAppCardProps) {
  const { mode, install, dismiss } = useInstallApp();

  if (mode === "hidden") return null;

  return (
    <Card
      tone={tone}
      className={`${styles.card} ${MOBILE_ONLY ? styles.mobileOnly : ""} ${className}`}
    >
      <div className={styles.header}>
        <Image src="/icons/icon-192.png" alt="" width={48} height={48} className={styles.appIcon} />
        <div className={styles.copy}>
          <p className={styles.title}>Tené SocioSA en tu celular</p>
          <p className={styles.text}>Entrá más rápido desde tu pantalla de inicio, como una app.</p>
        </div>
        <button type="button" onClick={dismiss} aria-label="Ahora no" className={styles.close}>
          <X size={18} />
        </button>
      </div>

      {mode === "prompt" ? (
        <button type="button" onClick={() => void install()} className={styles.action}>
          <SquarePlus size={18} />
          Agregar a inicio
        </button>
      ) : (
        <ol className={styles.steps}>
          <li>
            Tocá <Share size={16} className={styles.inlineIcon} aria-label="Compartir" />{" "}
            <strong>Compartir</strong> en la barra del navegador.
          </li>
          <li>
            Elegí <SquarePlus size={16} className={styles.inlineIcon} aria-hidden />{" "}
            <strong>Agregar a inicio</strong>.
          </li>
        </ol>
      )}
    </Card>
  );
}
