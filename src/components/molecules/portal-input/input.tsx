"use client";

import { Search } from "lucide-react";
import type { KeyboardEventHandler } from "react";
import styles from "./input.module.scss";

type PortalInputProps = {
  label?: string;
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSearchClick?: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  variant?: "add-product" | "search";
  name?: string;
  disabled?: boolean;
};

export default function PortalInput({
  label,
  value = "",
  placeholder,
  onChange,
  onSearchClick,
  onKeyDown,
  variant = "search",
  name,
  disabled = false,
}: PortalInputProps) {
  const computedPlaceholder =
    placeholder ??
    (variant === "add-product" ? "Buscar o agregar otro producto" : "Buscar");

  return (
    <div className={styles.wrapper}>
      {label ? <label className={styles.label}>{label}</label> : null}

      <div className={styles.inputBox}>
        <div className={styles.left}>
          {variant === "add-product" && <span className={styles.plus}>+</span>}

          <input
            type="text"
            name={name}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={computedPlaceholder}
            className={styles.input}
            disabled={disabled}
          />
        </div>

        <button
          type="button"
          className={styles.iconButton}
          onClick={onSearchClick}
          aria-label="Buscar"
          disabled={disabled}
        >
          <Search size={22} />
        </button>
      </div>
    </div>
  );
}
