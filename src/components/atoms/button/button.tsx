"use client";

import Image from "next/image";
import { Loader2, MessageCircle } from "lucide-react";
import googleLogo from "@/assets/google-logo.svg";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./button.module.scss";

type PortalButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  /** `google`: blanco con el logo de Google (botón "Continuar con Google"). */
  variant?: "primary" | "secondary" | "mercadopago" | "google";
  onClick?: () => void;
  disabled?: boolean;
  withChatIcon?: boolean;
  /** Ícono a la izquierda del texto. */
  icon?: React.ReactNode;
  /** Muestra un spinner en lugar del ícono y deshabilita el botón. */
  loading?: boolean;
  /** Sin tono = violeta del formulario de CORA (comportamiento original). */
  tone?: UiTone;
};

const VARIANT_STYLES = {
  primary: styles.primary,
  secondary: styles.secondary,
  mercadopago: styles.mercadopago,
  google: styles.google,
};

export default function PortalButton({
  children,
  type = "button",
  variant = "primary",
  onClick,
  disabled = false,
  withChatIcon = false,
  icon,
  loading = false,
  tone,
}: PortalButtonProps) {
  const toned = tone ? `${styles.toned} ${toneClass(tone)}` : "";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${styles.button} ${VARIANT_STYLES[variant]} ${toned}`}
    >
      {loading ? (
        <Loader2 size={20} className={`${styles.icon} ${styles.spin}`} aria-hidden />
      ) : (
        <>
          {withChatIcon && <MessageCircle size={22} className={styles.icon} />}
          {icon && <span className={styles.icon}>{icon}</span>}
          {variant === "google" && (
            <Image src={googleLogo} alt="" width={20} height={20} className={styles.icon} />
          )}
        </>
      )}
      {variant === "mercadopago" && (
        <Image
          src="/mercadopago-icon.svg"
          alt=""
          width={22}
          height={22}
          className={styles.icon}
        />
      )}
      <span>{children}</span>
    </button>
  );
}
