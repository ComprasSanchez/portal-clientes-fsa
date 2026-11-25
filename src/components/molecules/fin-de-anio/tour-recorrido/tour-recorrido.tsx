/* eslint-disable @next/next/no-img-element -- dibujo chico y estático */
import TourPildora from "@/components/molecules/fin-de-anio/tour-pildora/tour-pildora";
import {
  horarioParada,
  nombreParada,
  PAPA_NOEL_IMAGEN,
  PILDORA_PARADA,
  type ParadaConSucursal,
} from "@/lib/tour-papa-noel";
import styles from "./tour-recorrido.module.scss";

type TourRecorridoProps = {
  paradas: ParadaConSucursal[];
  /** Parada donde se dibuja a Papá Noel (la de ahora o la próxima). */
  destacada: number | null;
};

const VARIANTE = { AHORA: "llena", PROXIMA: "llena", SIGUE: "contorno", YA_PASO: "apagada" } as const;

/** Todas las paradas en orden, unidas por una línea, con Papá Noel en la destacada. */
export default function TourRecorrido({ paradas, destacada }: TourRecorridoProps) {
  return (
    <ol className={styles.recorrido}>
      {paradas.map((p) => (
        <li key={p.orden} className={`${styles.parada} ${p.estado === "YA_PASO" ? styles.pasada : ""}`}>
          <span className={styles.marca} aria-hidden>
            {p.orden === destacada ? (
              <img src={PAPA_NOEL_IMAGEN} alt="" className={styles.papaNoel} />
            ) : (
              <span className={styles.punto} />
            )}
          </span>
          <div className={styles.datos}>
            <div className={styles.cabecera}>
              <h4 className={styles.nombre}>{nombreParada(p)}</h4>
              <TourPildora variante={VARIANTE[p.estado]}>{PILDORA_PARADA[p.estado]}</TourPildora>
            </div>
            <p>{horarioParada(p)}</p>
            {p.datos?.direccion && <p>{p.datos.direccion}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
