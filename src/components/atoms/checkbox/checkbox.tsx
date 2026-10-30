import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./checkbox.module.scss";

type CheckboxProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: string;
  tone?: UiTone;
};

/** Casilla con texto (ej. "Mantener la sesión iniciada"). */
export default function Checkbox({ id, checked, onChange, label, hint, tone = "socios" }: CheckboxProps) {
  return (
    <label htmlFor={id} className={`${styles.wrap} ${toneClass(tone)}`}>
      <input
        id={id}
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.box} aria-hidden>
        <Check size={14} strokeWidth={3} />
      </span>
      <span className={styles.copy}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
    </label>
  );
}
