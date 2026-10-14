import type { ReactNode } from "react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./stat-tile.module.scss";

type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** Ícono chico al lado de la etiqueta (ej. `<Truck size={18} />`). */
  icon?: ReactNode;
  tone?: UiTone;
  /**
   * - `card` (default): tarjeta blanca con borde.
   * - `soft`: fondo suave del tema, sin borde.
   * - `highlight`: degradé con el color del tema y texto blanco.
   */
  variant?: "card" | "soft" | "highlight";
  /** `lg` para números destacados; `sm` para textos cortos (ej. un estado). */
  size?: "lg" | "sm";
};

/** Dato con etiqueta: totales, estado, fecha, etc. */
export default function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "socios",
  variant = "card",
  size = "lg",
}: StatTileProps) {
  return (
    <article className={`${styles.tile} ${styles[variant]} ${toneClass(tone)}`}>
      <span className={styles.label}>
        {icon}
        {label}
      </span>
      <strong className={`${styles.value} ${styles[size]}`}>{value}</strong>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </article>
  );
}
