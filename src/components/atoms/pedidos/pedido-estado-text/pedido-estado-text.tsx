import {
  getPedidoEstadoLabel,
  getPedidoEstadoTone,
  type PedidoEstadoTone,
} from "@/lib/portal-pedidos";
import styles from "./pedido-estado-text.module.scss";

const TONE_CLASS: Record<PedidoEstadoTone, string> = {
  active: styles.active,
  success: styles.success,
  error: styles.error,
};

/** Último estado del pedido como texto coloreado, para usar de título. */
export function PedidoEstadoText({
  idEstado,
  className = "",
}: {
  idEstado: number;
  className?: string;
}) {
  return (
    <span
      className={`${styles.text} ${TONE_CLASS[getPedidoEstadoTone(idEstado)]} ${className}`}
    >
      {getPedidoEstadoLabel(idEstado)}
    </span>
  );
}
