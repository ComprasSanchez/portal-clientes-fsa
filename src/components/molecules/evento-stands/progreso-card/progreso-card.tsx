import { Check } from "lucide-react";
import Badge from "@/components/atoms/badge/badge";
import Card from "@/components/atoms/card/card";
import { type UiTone } from "@/types/ui-tone";
import styles from "./progreso-card.module.scss";

type ProgresoCardProps = {
  escaneados: number;
  /** Stands necesarios para el premio: un segmento de la barra por cada uno. */
  meta: number;
  texto: string;
  tone?: UiTone;
};

/** Camino al premio: número grande, porcentaje y barra con un segmento por stand. */
export default function ProgresoCard({ escaneados, meta, texto, tone = "socios" }: ProgresoCardProps) {
  const hechos = Math.min(escaneados, meta);
  const porcentaje = meta > 0 ? Math.round((hechos / meta) * 100) : 0;
  const completo = meta > 0 && hechos >= meta;

  return (
    <Card tone={tone} className={completo ? styles.completo : ""}>
      <div className={styles.top}>
        <p className={styles.label}>Tu camino al premio</p>
        {completo ? (
          <Badge tone={tone} color="success" size="sm" icon={<Check size={14} />}>
            ¡Completado!
          </Badge>
        ) : (
          <Badge tone={tone} color="neutral" size="sm">
            {porcentaje}%
          </Badge>
        )}
      </div>

      <p className={styles.count}>
        <span className={styles.number}>{hechos}</span>
        <span className={styles.total}> / {meta} stands escaneados</span>
      </p>

      <div
        className={styles.bar}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={meta}
        aria-valuenow={hechos}
        aria-label="Stands escaneados"
      >
        {Array.from({ length: meta }, (_, i) => (
          <span key={i} className={`${styles.segment} ${i < hechos ? styles.filled : ""}`} />
        ))}
      </div>

      <p className={styles.text}>{texto}</p>
    </Card>
  );
}
