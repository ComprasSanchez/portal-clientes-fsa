import type { CSSProperties } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CALENDARIO_DIAS, posicionComoVariables } from "@/lib/fin-de-anio";
import styles from "./calendario-skeleton.module.scss";

/** Carga del calendario con la misma forma de la grilla (celular y compu). */
export default function CalendarioSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Cargando el calendario">
      <Skeleton className={styles.bajada} />
      <div className={styles.grilla}>
        <Skeleton className={`${styles.celda} ${styles.titulo}`} />
        {CALENDARIO_DIAS.map((dia) => (
          <Skeleton
            key={dia.dia}
            className={`${styles.celda} ${styles.dia}`}
            style={posicionComoVariables(dia) as CSSProperties}
          />
        ))}
        <Skeleton className={`${styles.celda} ${styles.anioNuevo}`} />
      </div>
    </div>
  );
}
