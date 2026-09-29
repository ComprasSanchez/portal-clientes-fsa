import { ExternalLink, type LucideIcon } from "lucide-react";
import styles from "./AplicacionCard.module.scss";

interface AplicacionCardProps {
  nombre: string;
  descripcion: string;
  icon: LucideIcon;
  /** Sin URL la card se muestra deshabilitada como "Próximamente". */
  href: string | null;
}

export function AplicacionCard({ nombre, descripcion, icon: Icon, href }: AplicacionCardProps) {
  const content = (
    <>
      <span className={styles.iconWrap}>
        <Icon size={22} />
      </span>
      <span className={styles.body}>
        <span className={styles.nombre}>{nombre}</span>
        <span className={styles.descripcion}>{descripcion}</span>
      </span>
      <span className={styles.action}>
        {href ? (
          <>
            Abrir
            <ExternalLink size={14} />
          </>
        ) : (
          "Próximamente"
        )}
      </span>
    </>
  );

  if (!href) {
    return (
      <div className={`${styles.card} ${styles.disabled}`} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <a
      className={styles.card}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir ${nombre} en una pestaña nueva`}
    >
      {content}
    </a>
  );
}
