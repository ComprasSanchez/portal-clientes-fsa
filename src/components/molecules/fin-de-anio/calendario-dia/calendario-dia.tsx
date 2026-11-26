import type { CSSProperties } from "react";
import {
  ILUSTRACIONES,
  diaConCero,
  fechaLegible,
  posicionComoVariables,
  type CalendarioDia as Dia,
} from "@/lib/fin-de-anio";
import styles from "./calendario-dia.module.scss";

type CalendarioDiaProps = {
  dia: Dia;
  /** futuro: con candado · hoy: lista para abrir · vencido: no se abrió en su día (tachada). */
  estado: "futuro" | "hoy" | "vencido";
  onClick: () => void;
};

const ETIQUETA = {
  futuro: "todavía cerrado",
  hoy: "¡abrilo hoy!",
  vencido: "ya pasó",
};

/** Casilla cerrada de un día del calendario de regalos. */
export default function CalendarioDia({ dia, estado, onClick }: CalendarioDiaProps) {
  const ilus = ILUSTRACIONES[dia.ilustracion];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.dia} ${styles[dia.color]} ${styles[`numero-${ilus.numero}`] ?? ""} ${styles[estado]}`}
      style={posicionComoVariables(dia) as CSSProperties}
      aria-label={`${fechaLegible(dia.dia)}, ${ETIQUETA[estado]}`}
    >
      {ilus.imagen && (
        // eslint-disable-next-line @next/next/no-img-element -- decorativa y recortada por CSS
        <img src={ilus.imagen} alt="" aria-hidden className={`${styles.ilustracion} ${styles[`ilus-${dia.ilustracion}`]}`} />
      )}

      <span className={styles.fecha}>
        <span className={styles.numero}>{diaConCero(dia.dia)}</span>
        <span className={styles.mes}>DIC</span>
      </span>

      {dia.ilustracion === "navidad" && (
        <span className={styles.textoNavidad}>
          ¡Feliz
          <br />
          Navidad!
        </span>
      )}

      {estado === "futuro" && (
        <span className={`${styles.candado} ${styles[`candado-${ilus.candado}`]}`} aria-hidden />
      )}
      {estado === "hoy" && <span className={styles.chipHoy}>¡Abrime!</span>}
    </button>
  );
}
