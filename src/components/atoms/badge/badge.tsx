import type { ReactNode } from "react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./badge.module.scss";

export type BadgeColor =
  | "primary"
  | "solid"
  | "overlay"
  | "success"
  | "danger"
  | "warning"
  | "neutral"
  | "breve";

type BadgeProps = {
  children: ReactNode;
  /**
   * `primary` (suave) y `solid` (relleno) usan el color del tema (`tone`);
   * `overlay` es para fondos oscuros; el resto son colores fijos.
   */
  color?: BadgeColor;
  tone?: UiTone;
  size?: "sm" | "md";
  uppercase?: boolean;
  /** Permite varias líneas, para textos largos (por defecto queda en una). */
  wrap?: boolean;
  /** Ícono opcional a la izquierda del texto. */
  icon?: ReactNode;
  className?: string;
};

/** Pastilla de estado o etiqueta: "Rechazado", "CORA", "Verificado", etc. */
export default function Badge({
  children,
  color = "primary",
  tone = "socios",
  size = "sm",
  uppercase = false,
  wrap = false,
  icon,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[size]} ${styles[color]} ${toneClass(tone)} ${
        uppercase ? styles.uppercase : ""
      } ${wrap ? styles.wrap : ""} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
