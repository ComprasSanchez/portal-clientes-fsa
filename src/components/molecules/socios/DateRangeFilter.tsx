"use client";

import { useState } from "react";
import { PortalDatePicker } from "@/components/molecules/expedientes/PortalDatePicker";
import styles from "./DateRangeFilter.module.scss";

interface DateRangeFilterProps {
  /** YYYY-MM-DD aplicados actualmente. */
  desde: string;
  hasta: string;
  /** YYYY-MM-DD. Fecha máxima seleccionable (ej. hoy). */
  maxValue?: string;
  onApply: (range: { desde: string; hasta: string }) => void;
  /** Si viene, muestra un botón para volver al rango por defecto. */
  onReset?: () => void;
  resetLabel?: string;
  disabled?: boolean;
}

export function DateRangeFilter({
  desde,
  hasta,
  maxValue,
  onApply,
  onReset,
  resetLabel = "Ver mes actual",
  disabled = false,
}: DateRangeFilterProps) {
  // El borrador arranca desde el rango aplicado. Si el rango aplicado cambia
  // desde afuera, el padre remonta el componente con `key`.
  const [draftDesde, setDraftDesde] = useState(desde);
  const [draftHasta, setDraftHasta] = useState(hasta);

  const invalid = !draftDesde || !draftHasta || draftDesde > draftHasta;
  const unchanged = draftDesde === desde && draftHasta === hasta;

  return (
    <div className={styles.filter}>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Desde</span>
        <PortalDatePicker
          tone="socios"
          aria-label="Desde"
          value={draftDesde}
          maxValue={draftHasta || maxValue}
          onChange={setDraftDesde}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Hasta</span>
        <PortalDatePicker
          tone="socios"
          aria-label="Hasta"
          value={draftHasta}
          minValue={draftDesde || undefined}
          maxValue={maxValue}
          onChange={setDraftHasta}
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.applyButton}
          disabled={disabled || invalid || unchanged}
          onClick={() => onApply({ desde: draftDesde, hasta: draftHasta })}
        >
          Filtrar
        </button>
        {onReset ? (
          <button
            type="button"
            className={styles.resetButton}
            disabled={disabled}
            onClick={onReset}
          >
            {resetLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
