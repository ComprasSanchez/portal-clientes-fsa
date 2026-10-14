import { ChevronRight, type LucideIcon } from "lucide-react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./notification-category-row.module.scss";

type NotificationCategoryRowProps = {
  label: string;
  icon: LucideIcon;
  /** Color propio de la categoría (ícono y su círculo de fondo). */
  color: string;
  unread: number;
  /** Texto de la última novedad de la categoría. */
  preview: string;
  onClick: () => void;
  tone?: UiTone;
};

/** Fila de una categoría de notificaciones: ícono, nombre, no leídas y última novedad. */
export function NotificationCategoryRow({
  label,
  icon: Icon,
  color,
  unread,
  preview,
  onClick,
  tone = "cora",
}: NotificationCategoryRowProps) {
  return (
    <button type="button" onClick={onClick} className={`${styles.row} ${toneClass(tone)}`}>
      <div className={styles.icon} style={{ backgroundColor: `${color}1a`, color }}>
        <Icon size={20} />
      </div>
      <div className={styles.texts}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{label}</span>
          {unread > 0 && <span className={styles.count}>{unread > 9 ? "9+" : unread}</span>}
        </div>
        <p className={styles.preview}>{preview}</p>
      </div>
      <ChevronRight size={18} className={styles.chevron} />
    </button>
  );
}
