import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPaginationItems } from "@/lib/pagination";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./pagination.module.scss";

type PaginationProps = {
  /** Página actual, empezando en 0. */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  tone?: UiTone;
  /** Texto chico debajo de los botones (ej. "34 resultados"). */
  summary?: ReactNode;
  /** Bloquea los botones (ej. mientras se busca la página pedida). */
  disabled?: boolean;
  className?: string;
};

/**
 * Anterior / números de página / siguiente. Con muchas páginas muestra "…"
 * (ej. 1 … 4 5 6 … 20). No se muestra si hay una sola página.
 */
export default function Pagination({
  page,
  totalPages,
  onChange,
  tone = "socios",
  summary,
  disabled = false,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`${styles.wrapper} ${toneClass(tone)} ${className}`}>
      <nav className={styles.pagination} aria-label="Paginación">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={disabled || page === 0}
          className={styles.button}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <div className={styles.pages}>
          {getPaginationItems(page, totalPages).map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                onClick={() => onChange(item)}
                disabled={disabled}
                aria-current={item === page ? "page" : undefined}
                className={`${styles.button} ${item === page ? styles.active : ""}`}
              >
                {item + 1}
              </button>
            ) : (
              <span key={item} className={styles.ellipsis} aria-hidden="true">
                …
              </span>
            ),
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={disabled || page >= totalPages - 1}
          className={styles.button}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </nav>
      {summary && <p className={styles.summary}>{summary}</p>}
    </div>
  );
}
