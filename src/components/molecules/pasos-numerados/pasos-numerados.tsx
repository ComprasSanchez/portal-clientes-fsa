import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./pasos-numerados.module.scss";

type Paso = { titulo: string; texto?: string };

type PasosNumeradosProps = {
  pasos: Paso[];
  tone?: UiTone;
};

/** Pasos cortos con número (ej. "Cómo funciona"). */
export default function PasosNumerados({ pasos, tone = "socios" }: PasosNumeradosProps) {
  return (
    <ol className={`${styles.pasos} ${toneClass(tone)}`}>
      {pasos.map((p, i) => (
        <li key={p.titulo} className={styles.paso}>
          <span className={styles.numero} aria-hidden>
            {i + 1}
          </span>
          <span className={styles.textos}>
            <strong className={styles.titulo}>{p.titulo}</strong>
            {p.texto && <span className={styles.texto}>{p.texto}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
