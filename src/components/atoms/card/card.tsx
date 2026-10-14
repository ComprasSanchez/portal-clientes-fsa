import type { ReactNode } from "react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./card.module.scss";

type CardProps = {
  children: ReactNode;
  /** Título chico en mayúsculas arriba del contenido (ej. "Seguimiento"). */
  title?: string;
  tone?: UiTone;
  /** `md` panel normal, `lg` panel grande (encabezado de vista), `none` sin padding. */
  padding?: "md" | "lg" | "none";
  className?: string;
};

const PADDING_CLASS = {
  md: styles.paddingMd,
  lg: styles.paddingLg,
  none: styles.paddingNone,
};

/** Tarjeta blanca con borde, la base de paneles y secciones. */
export default function Card({
  children,
  title,
  tone = "socios",
  padding = "md",
  className = "",
}: CardProps) {
  return (
    <section
      className={`${styles.card} ${PADDING_CLASS[padding]} ${toneClass(tone)} ${className}`}
    >
      {title && <p className={styles.title}>{title}</p>}
      {children}
    </section>
  );
}
