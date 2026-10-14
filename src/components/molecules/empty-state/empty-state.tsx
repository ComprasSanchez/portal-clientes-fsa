import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Card from "@/components/atoms/card/card";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./empty-state.module.scss";

type EmptyStateProps = {
  icon: LucideIcon;
  title?: string;
  text?: string;
  /** Botón u otra acción opcional debajo del texto (ej. "Limpiar búsqueda"). */
  action?: ReactNode;
  tone?: UiTone;
  /**
   * - `card` (default): dentro de su propia tarjeta.
   * - `plain`: sin tarjeta, para usarlo adentro de un panel que ya tiene borde.
   * - `dashed`: recuadro punteado (ej. "todavía no hay sorteo").
   */
  variant?: "card" | "plain" | "dashed";
  className?: string;
};

/** Mensaje centrado con ícono para listas vacías o recursos no encontrados. */
export default function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  tone = "socios",
  variant = "card",
  className = "",
}: EmptyStateProps) {
  const isCard = variant === "card";

  const content = (
    <div
      className={`${styles.panel} ${isCard ? "" : styles.compact} ${
        variant === "dashed" ? styles.dashed : ""
      } ${toneClass(tone)} ${isCard ? "" : className}`}
    >
      <div className={styles.icon}>
        <Icon size={isCard ? 28 : 22} />
      </div>
      {title && <p className={styles.title}>{title}</p>}
      {text && <p className={styles.text}>{text}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );

  return isCard ? (
    <Card tone={tone} className={className}>
      {content}
    </Card>
  ) : (
    content
  );
}
