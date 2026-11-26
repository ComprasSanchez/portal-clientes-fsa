import type { CalendarioColor } from "@/lib/fin-de-anio";
import styles from "./revelado-puertas.module.scss";

type ReveladoPuertasProps = {
  color: CalendarioColor;
};

/** Dos puertas con el color del día que se abren al aparecer (como un armario). */
export default function ReveladoPuertas({ color }: ReveladoPuertasProps) {
  return (
    <div className={`${styles.puertas} ${styles[color]}`} aria-hidden>
      <div className={`${styles.puerta} ${styles.izquierda}`}>
        <span className={styles.manija} />
      </div>
      <div className={`${styles.puerta} ${styles.derecha}`}>
        <span className={styles.manija} />
      </div>
    </div>
  );
}
