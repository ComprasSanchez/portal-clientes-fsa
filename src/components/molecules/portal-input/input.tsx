"use client";

import { Search } from "lucide-react";
import styles from "./input.module.scss";

type PortalInputProps = {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  variant?: "add-product" | "search";
  name?: string;
  disabled?: boolean;
};

export default function PortalInput({
  value = "",
  placeholder,
  onChange,
  variant = "search",
  name,
  disabled = false,
}: PortalInputProps) {
  const computedPlaceholder =
    placeholder ??
    (variant === "add-product" ? "Buscar o agregar otro producto" : "Buscar");

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputBox}>
        <div className={styles.left}>
          {variant === "add-product" && <span className={styles.plus}>+</span>}

          <input
            type="text"
            name={name}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={computedPlaceholder}
            className={styles.input}
            disabled={disabled}
          />
        </div>

        <button
          type="button"
          className={styles.iconButton}
          aria-label="Buscar"
          disabled={disabled}
        >
          <Search size={22} />
        </button>
      </div>
    </div>
  );
}
