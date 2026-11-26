import styles from "./vista-previa-socio.module.scss";

type VistaPreviaSocioProps = {
  titulo: string;
  detalle?: string | null;
  /** Dato destacado abajo (ej. "Quedan 30 de 30"). */
  extra?: string | null;
};

/** Recuadro "Así lo ve el socio" con los textos de la tarjeta que abre. */
export default function VistaPreviaSocio({ titulo, detalle, extra }: VistaPreviaSocioProps) {
  return (
    <div className={styles.previa} aria-live="polite">
      <span className={styles.etiqueta}>Así lo ve el socio</span>
      <strong className={styles.titulo}>{titulo}</strong>
      {detalle && <span>{detalle}</span>}
      {extra && <span className={styles.extra}>{extra}</span>}
    </div>
  );
}
