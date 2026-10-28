import Badge from "@/components/atoms/badge/badge";
import Card from "@/components/atoms/card/card";
import { type UiTone } from "@/types/ui-tone";
import styles from "./progreso-card.module.scss";

type ProgresoCardProps = {
  escaneados: number;
  total: number;
  /** Stands necesarios para el premio: se marca en la barra. */
  minimo: number;
  texto: string;
  tone?: UiTone;
};

/** Avance del juego: número grande, porcentaje y barra con un segmento por stand. */
export default function ProgresoCard({
  escaneados,
  total,
  minimo,
  texto,
  tone = "socios",
}: ProgresoCardProps) {
  const porcentaje = total > 0 ? Math.round((escaneados / total) * 100) : 0;

  return (
    <Card tone={tone}>
      <div className={styles.top}>
        <p className={styles.label}>Tu progreso</p>
        <Badge tone={tone} color="neutral" size="sm">
          {porcentaje}%
        </Badge>
      </div>

      <p className={styles.count}>
        <span className={styles.number}>{escaneados}</span>
        <span className={styles.total}> / {total} stands</span>
      </p>

      <div
        className={styles.bar}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={escaneados}
        aria-label="Stands escaneados"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`${styles.segment} ${i < escaneados ? styles.filled : ""} ${
              i === minimo - 1 ? styles.goal : ""
            }`}
          />
        ))}
      </div>

      <p className={styles.text}>{texto}</p>
    </Card>
  );
}
