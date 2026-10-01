import { formatPortalCurrency } from "@/lib/portal-compras";
import { formatPortalPoints } from "@/lib/portal-puntos";
import type { PortalVentasColaboradorDia } from "@/types/portal-colaborador";
import styles from "./VentasDiariasChart.module.scss";

interface VentasDiariasChartProps {
  dias: PortalVentasColaboradorDia[];
}

const SERIES = [
  { key: "particular", label: "Particular", className: styles.particular },
  { key: "obra_social", label: "Obra social", className: styles.obraSocial },
  { key: "pami", label: "PAMI", className: styles.pami },
] as const;

const formatDiaCorto = (fecha: string) => {
  const [, month, day] = fecha.split("-");
  return `${day}/${month}`;
};

export function VentasDiariasChart({ dias }: VentasDiariasChartProps) {
  const maxTotal = Math.max(...dias.map((d) => d.total), 0);

  return (
    <figure className={styles.chart}>
      <figcaption className={styles.legend}>
        {SERIES.map((serie) => (
          <span key={serie.key} className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${serie.className}`} />
            {serie.label}
          </span>
        ))}
      </figcaption>

      <div className={styles.scroll}>
        <ol className={styles.bars} style={{ minWidth: `${dias.length * 2.25}rem` }}>
          {dias.map((dia) => {
            const heightPct = maxTotal ? (dia.total / maxTotal) * 100 : 0;
            const detalle = `${formatDiaCorto(dia.fecha)}: ${formatPortalCurrency(dia.total)} · ${formatPortalPoints(dia.tickets)} tickets`;

            return (
              <li key={dia.fecha} className={styles.barItem} title={detalle}>
                <span className={styles.srOnly}>{detalle}</span>
                <div className={styles.barTrack} aria-hidden="true">
                  <div className={styles.bar} style={{ height: `${heightPct}%` }}>
                    {SERIES.map((serie) =>
                      dia[serie.key] > 0 ? (
                        <span
                          key={serie.key}
                          className={serie.className}
                          style={{ flexGrow: dia[serie.key] }}
                        />
                      ) : null,
                    )}
                  </div>
                </div>
                <span className={styles.barLabel} aria-hidden="true">
                  {formatDiaCorto(dia.fecha)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </figure>
  );
}
