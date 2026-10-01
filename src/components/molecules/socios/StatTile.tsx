import type { ReactNode } from "react";
import styles from "./StatTile.module.scss";

type StatTileTone = "primary" | "plain";

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** `primary`: tarjeta destacada con degradé (ej. total del período). */
  tone?: StatTileTone;
}

export function StatTile({ label, value, hint, tone = "plain" }: StatTileProps) {
  return (
    <article className={`${styles.tile} ${tone === "primary" ? styles.primary : ""}`}>
      <span className={styles.label}>{label}</span>
      <strong className={styles.value}>{value}</strong>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </article>
  );
}
