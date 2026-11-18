import type { ReactNode } from "react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./section-heading.module.scss";

type SectionHeadingProps = {
  title: string;
  /** Texto liviano después del título (ej. la marca). */
  subtitle?: string;
  /** Pastilla u otro detalle debajo del título. */
  aside?: ReactNode;
  id?: string;
  tone?: UiTone;
};

/** Título de sección con línea inferior: "DERMO · ACCURATO" + pastilla. */
export default function SectionHeading({
  title,
  subtitle,
  aside,
  id,
  tone = "socios",
}: SectionHeadingProps) {
  return (
    <header className={`${styles.heading} ${toneClass(tone)}`}>
      <h2 id={id} className={styles.title}>
        <span className={styles.strong}>{title}</span>
        {subtitle && <span className={styles.light}> · {subtitle}</span>}
      </h2>
      {aside}
    </header>
  );
}
