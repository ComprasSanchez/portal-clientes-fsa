import { diaConCero } from "@/lib/fin-de-anio";
import styles from "./revelado-fichas.module.scss";

type ReveladoFichasProps = {
  dia: number;
  /** Caen desde arriba con rebote; si no, quedan quietas. */
  animado: boolean;
};

/** Los dos dígitos del día en fichas, como en el prototipo. */
export default function ReveladoFichas({ dia, animado }: ReveladoFichasProps) {
  return (
    <div className={`${styles.fichas} ${animado ? styles.animado : ""}`} aria-label={`Día ${dia}`}>
      {diaConCero(dia)
        .split("")
        .map((digito, i) => (
          <span key={i} className={styles.ficha} aria-hidden>
            {digito}
          </span>
        ))}
    </div>
  );
}
