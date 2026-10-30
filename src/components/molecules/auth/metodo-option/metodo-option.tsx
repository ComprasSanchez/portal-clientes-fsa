import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./metodo-option.module.scss";

type MetodoOptionProps = {
  icon: ReactNode;
  title: string;
  text: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: UiTone;
};

/** Opción grande para elegir cómo ingresar (contraseña o código por email). */
export default function MetodoOption({
  icon,
  title,
  text,
  onClick,
  disabled = false,
  tone = "socios",
}: MetodoOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${styles.option} ${toneClass(tone)}`}
    >
      <span className={styles.icon} aria-hidden>
        {icon}
      </span>
      <span className={styles.copy}>
        <span className={styles.title}>{title}</span>
        <span className={styles.text}>{text}</span>
      </span>
      <ChevronRight size={20} className={styles.arrow} aria-hidden />
    </button>
  );
}
