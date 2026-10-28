import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./como-funciona.module.scss";

type ComoFuncionaProps = {
  pasos: Array<{ titulo: string; texto: string }>;
  /** `auto`: en columnas en pantallas anchas. `stack`: siempre uno abajo del otro (ej. en un modal). */
  layout?: "auto" | "stack";
  tone?: UiTone;
};

/** Pasos numerados que explican el juego. */
export default function ComoFunciona({ pasos, layout = "auto", tone = "socios" }: ComoFuncionaProps) {
  return (
    <ol className={`${styles.list} ${layout === "auto" ? styles.auto : ""} ${toneClass(tone)}`}>
      {pasos.map((paso, i) => (
        <li key={paso.titulo} className={styles.item}>
          <span className={styles.number} aria-hidden>
            {i + 1}
          </span>
          <div>
            <p className={styles.title}>{paso.titulo}</p>
            <p className={styles.text}>{paso.texto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
