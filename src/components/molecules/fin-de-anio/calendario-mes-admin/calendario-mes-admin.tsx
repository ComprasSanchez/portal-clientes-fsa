import CalendarioCeldaAdmin from "@/components/molecules/fin-de-anio/calendario-celda-admin/calendario-celda-admin";
import TipoDiaIcono from "@/components/molecules/fin-de-anio/tipo-dia-icono/tipo-dia-icono";
import { DIAS_SEMANA, huecosAntesDe, TIPO_DIA_NOMBRE, TIPOS_DIA, type DiaAdmin } from "@/lib/calendario-admin";
import styles from "./calendario-mes-admin.module.scss";

type CalendarioMesAdminProps = {
  dias: DiaAdmin[];
  onAbrir: (dia: DiaAdmin) => void;
};

/** Diciembre como calendario (lunes a domingo), con la referencia de colores abajo. */
export default function CalendarioMesAdmin({ dias, onAbrir }: CalendarioMesAdminProps) {
  const huecos = dias.length ? huecosAntesDe(dias[0].fecha) : 0;
  return (
    <div className={styles.mes}>
      <div className={styles.grilla} role="grid" aria-label="Días de diciembre">
        {DIAS_SEMANA.map((d) => (
          <span key={d} className={styles.diaSemana} role="columnheader">
            {d}
          </span>
        ))}
        {Array.from({ length: huecos }, (_, i) => (
          <span key={`h${i}`} aria-hidden />
        ))}
        {dias.map((d) => (
          <CalendarioCeldaAdmin key={d.fecha} dia={d} onAbrir={() => onAbrir(d)} />
        ))}
      </div>

      <ul className={styles.referencias} aria-label="Referencias">
        {TIPOS_DIA.map((t) => (
          <li key={t} className={styles.referencia} data-tipo={t}>
            <TipoDiaIcono tipo={t} size={14} />
            {TIPO_DIA_NOMBRE[t]}
          </li>
        ))}
        <li className={`${styles.referencia} ${styles.refVacia}`}>Sin cargar</li>
      </ul>
    </div>
  );
}
