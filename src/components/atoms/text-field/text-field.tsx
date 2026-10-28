"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./text-field.module.scss";

type TextFieldProps = {
  id: string;
  label: string;
  /** Acción a la derecha de la etiqueta (ej. "¿Olvidaste tu contraseña?"). */
  labelAction?: ReactNode;
  error?: string | null;
  hint?: string;
  tone?: UiTone;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

/** Campo de texto con etiqueta, ayuda y error. Para `type="password"` suma el botón de mostrar. */
export default function TextField({
  id,
  label,
  labelAction,
  error,
  hint,
  tone = "socios",
  type = "text",
  className = "",
  ...inputProps
}: TextFieldProps) {
  const [visible, setVisible] = useState(false);
  const esPassword = type === "password";
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`${styles.field} ${toneClass(tone)} ${className}`}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {labelAction}
      </div>
      <div className={styles.control}>
        <input
          id={id}
          type={esPassword && visible ? "text" : type}
          className={`${styles.input} ${error ? styles.invalid : ""} ${esPassword ? styles.withAction : ""}`}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...inputProps}
        />
        {esPassword && (
          <button
            type="button"
            className={styles.action}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {visible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
