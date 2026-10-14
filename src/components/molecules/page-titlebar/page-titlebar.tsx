import BackButton from "@/components/atoms/back-button/back-button";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./page-titlebar.module.scss";

type PageTitlebarProps = {
  title: string;
  onBack: () => void;
  /** Texto del botón para lectores de pantalla (ej. "Volver a mis pedidos"). */
  backLabel: string;
  tone?: UiTone;
};

/** "‹ Título": barra con botón de volver para vistas de detalle. */
export default function PageTitlebar({ title, onBack, backLabel, tone = "socios" }: PageTitlebarProps) {
  return (
    <div className={`${styles.titlebar} ${toneClass(tone)}`}>
      <BackButton ariaLabel={backLabel} onClick={onBack} tone={tone} />
      <span className={styles.title}>{title}</span>
    </div>
  );
}
