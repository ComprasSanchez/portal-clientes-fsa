import type { CSSProperties } from "react";
import {
  diaConCero,
  fechaLegible,
  posicionComoVariables,
  regaloDelDia,
  type CalendarioDia as Dia,
} from "@/lib/fin-de-anio";
import styles from "./calendario-regalo.module.scss";

type CalendarioRegaloProps = {
  dia: Dia;
  /** En la grilla: casilla ya abierta (oscurecida, como el diseño) que se toca para verla. */
  enGrilla?: boolean;
  esHoy?: boolean;
  onClick?: () => void;
};

/** Tarjeta del regalo de un día ya desbloqueado. */
export default function CalendarioRegalo({ dia, enGrilla = false, esHoy = false, onClick }: CalendarioRegaloProps) {
  const clases = `${styles.regalo} ${styles[dia.color]} ${enGrilla ? styles.enGrilla : styles.detalle}`;
  const contenido = (
    <>
      <span className={styles.diaTexto}>DÍA {diaConCero(dia.dia)}</span>
      <span className={styles.pill}>Regalo desbloqueado</span>
      <span className={styles.lineas}>
        {regaloDelDia(dia.dia).map((linea) => (
          <span
            key={linea.texto}
            className={`${styles.linea} ${styles[`tam-${linea.tamano}`]} ${linea.fuente === "marca" ? styles.marca : ""}`}
          >
            {linea.texto}
          </span>
        ))}
      </span>
      <span className={styles.candado} aria-hidden />
    </>
  );

  if (!enGrilla) return <div className={clases}>{contenido}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className={clases}
      style={posicionComoVariables(dia) as CSSProperties}
      aria-label={`${fechaLegible(dia.dia)}: ver regalo${esHoy ? " de hoy" : ""}`}
    >
      {contenido}
    </button>
  );
}
