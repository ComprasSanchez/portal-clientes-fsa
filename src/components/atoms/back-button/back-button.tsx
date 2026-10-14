import { ArrowLeft, ChevronLeft } from "lucide-react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./back-button.module.scss";

type BackButtonProps = {
  /** Texto para lectores de pantalla (el botón solo muestra el ícono). */
  ariaLabel: string;
  onClick: () => void;
  tone?: UiTone;
  /** `ghost`: "‹" sin borde. `boxed`: "←" dentro de un recuadro con borde. */
  variant?: "ghost" | "boxed";
  size?: "md" | "sm";
};

/** Botón para volver atrás desde una vista de detalle o un paso. */
export default function BackButton({
  ariaLabel,
  onClick,
  tone = "socios",
  variant = "ghost",
  size = "md",
}: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.button} ${styles[variant]} ${size === "sm" ? styles.sm : ""} ${toneClass(tone)}`}
      aria-label={ariaLabel}
    >
      {variant === "boxed" ? (
        <ArrowLeft size={size === "sm" ? 18 : 20} />
      ) : (
        <ChevronLeft size={22} />
      )}
    </button>
  );
}
