import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./segmented-control.module.scss";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** `segmented`: pestañas en una caja. `pills`: pastillas sueltas con scroll horizontal. */
  variant?: "segmented" | "pills";
  tone?: UiTone;
  /** Describe el grupo para lectores de pantalla (ej. "Canal del pedido"). */
  ariaLabel: string;
  className?: string;
};

/** Elegir una opción entre varias: pestañas o filtros en forma de pastilla. */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "segmented",
  tone = "socios",
  ariaLabel,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`${styles[variant]} ${toneClass(tone)} ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={`${styles.option} ${isActive ? styles.active : ""}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
