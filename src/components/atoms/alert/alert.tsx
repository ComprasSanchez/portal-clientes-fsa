import type { ReactNode } from "react";
import styles from "./alert.module.scss";

export type AlertColor = "error" | "warning" | "success" | "info" | "neutral";

type AlertProps = {
  children: ReactNode;
  color?: AlertColor;
  /** Ícono opcional a la izquierda (ej. `<CircleAlert size={18} />` o un spinner). */
  icon?: ReactNode;
  className?: string;
};

/** Caja de mensaje: error al cargar, aviso, confirmación, "cargando...", etc. */
export default function Alert({ children, color = "error", icon, className = "" }: AlertProps) {
  return (
    <div
      role={color === "error" ? "alert" : "status"}
      className={`${styles.alert} ${styles[color]} ${className}`}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
