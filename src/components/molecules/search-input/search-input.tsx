import { Loader2, Search, X } from "lucide-react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./search-input.module.scss";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tone?: UiTone;
  /** `md` normal; `lg` grande con sombra (formulario público de CORA). */
  size?: "md" | "lg";
  /** Ícono a la izquierda: lupa, "+" (agregar productos) o nada. */
  leading?: "search" | "plus" | "none";
  /** Si viene, muestra una X para limpiar cuando hay texto. */
  onClear?: () => void;
  /** Buscar al apretar Enter (y con el botón, si `showSubmitButton`). */
  onSubmit?: () => void;
  /** Botón redondo con lupa a la derecha (requiere `onSubmit`). */
  showSubmitButton?: boolean;
  /** Muestra un spinner en el botón y lo bloquea mientras busca. */
  loading?: boolean;
  disabled?: boolean;
  /** Para lectores de pantalla, si no alcanza con el placeholder. */
  ariaLabel?: string;
  /** Para ajustar el ancho desde afuera (ej. "lg:w-96"). */
  className?: string;
};

/** Campo de búsqueda: filtra mientras se escribe o busca al apretar Enter / el botón. */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  tone = "socios",
  size = "md",
  leading = "search",
  onClear,
  onSubmit,
  showSubmitButton = false,
  loading = false,
  disabled = false,
  ariaLabel,
  className = "",
}: SearchInputProps) {
  return (
    <div
      className={`${styles.box} ${size === "lg" ? styles.lg : ""} ${toneClass(tone)} ${className}`}
    >
      {leading === "search" && (
        <span className={styles.leading}>
          <Search size={16} />
        </span>
      )}
      {leading === "plus" && (
        <span className={styles.plus} aria-hidden="true">
          +
        </span>
      )}

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmit) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        disabled={disabled}
        className={styles.input}
      />

      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          className={styles.clear}
          aria-label="Limpiar búsqueda"
        >
          <X size={16} />
        </button>
      )}

      {showSubmitButton && onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || loading}
          className={styles.submit}
          aria-label="Buscar"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </button>
      )}
    </div>
  );
}
