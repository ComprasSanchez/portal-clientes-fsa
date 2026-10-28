"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./bottom-sheet.module.scss";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Botones al pie (ej. "Entendido"). */
  footer?: ReactNode;
  tone?: UiTone;
};

/**
 * Hoja que sube desde abajo en celular (en pantallas grandes, ventana centrada).
 * Se cierra con la X, tocando afuera o con Escape; bloquea el scroll de fondo.
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  tone = "socios",
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`${styles.overlay} ${toneClass(tone)}`} onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.handle} aria-hidden />
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
