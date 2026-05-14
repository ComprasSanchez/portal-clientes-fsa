import { type ReactNode } from "react";
import styles from "./home-molecules.module.scss";

interface OrderRowProps {
  label: string;
  value: ReactNode;
  hasBorder?: boolean;
}

export function OrderRow({ label, value, hasBorder = true }: OrderRowProps) {
  return (
    <div className={`${styles.orderRow} ${hasBorder ? styles.orderRowBorder : ""}`.trim()}>
      <dt className={styles.orderLabel}>{label}</dt>
      <dd className={styles.orderValue}>{value}</dd>
    </div>
  );
}
