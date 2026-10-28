import { ArrowRight, QrCode } from "lucide-react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./escanear-cta.module.scss";

type EscanearCtaProps = {
  onClick: () => void;
  disabled?: boolean;
  tone?: UiTone;
};

/** Botón grande para abrir la cámara y escanear el QR de un stand. */
export default function EscanearCta({ onClick, disabled = false, tone = "socios" }: EscanearCtaProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${toneClass(tone)}`}
    >
      <span className={styles.icon} aria-hidden>
        <QrCode size={26} />
      </span>
      <span className={styles.copy}>
        <span className={styles.title}>Escanear un stand</span>
        <span className={styles.subtitle}>Abrí la cámara y apuntá al QR</span>
      </span>
      <ArrowRight size={22} className={styles.arrow} aria-hidden />
    </button>
  );
}
