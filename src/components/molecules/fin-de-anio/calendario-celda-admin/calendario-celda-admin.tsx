import { Lock } from "lucide-react";
import TipoDiaIcono from "@/components/molecules/fin-de-anio/tipo-dia-icono/tipo-dia-icono";
import { BLOQUEO_TEXTO, fechaLarga, resumenContenido, TIPO_DIA_NOMBRE, type DiaAdmin } from "@/lib/calendario-admin";
import styles from "./calendario-celda-admin.module.scss";

type CalendarioCeldaAdminProps = {
  dia: DiaAdmin;
  onAbrir: () => void;
};

/** Un día en la grilla de carga: número, tipo (color + ícono) y si está bloqueado. */
export default function CalendarioCeldaAdmin({ dia, onAbrir }: CalendarioCeldaAdminProps) {
  const { contenido, bloqueo } = dia;
  const estado = contenido ? TIPO_DIA_NOMBRE[contenido.tipo] : "Sin cargar";
  const etiqueta = `${fechaLarga(dia.fecha)}: ${estado}${bloqueo ? `, ${BLOQUEO_TEXTO[bloqueo].toLowerCase()}` : ""}`;

  return (
    <button
      type="button"
      className={`${styles.celda} ${contenido ? "" : styles.vacia} ${bloqueo ? styles.bloqueada : ""}`}
      data-tipo={contenido?.tipo}
      onClick={onAbrir}
      aria-label={etiqueta}
      title={etiqueta}
    >
      <span className={styles.cabecera}>
        <span className={styles.numero}>{Number(dia.fecha.slice(8))}</span>
        {bloqueo && <Lock size={12} className={styles.candado} aria-hidden />}
      </span>
      {contenido ? (
        <span className={styles.cuerpo}>
          <span className={styles.icono}>
            <TipoDiaIcono tipo={contenido.tipo} />
          </span>
          <span className={styles.tipo}>{TIPO_DIA_NOMBRE[contenido.tipo]}</span>
          <span className={styles.resumen}>{resumenContenido(contenido)}</span>
        </span>
      ) : (
        <span className={styles.sinCargar}>{bloqueo ? "" : "Cargar"}</span>
      )}
    </button>
  );
}
