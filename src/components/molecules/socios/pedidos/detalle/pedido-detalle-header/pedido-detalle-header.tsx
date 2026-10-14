import Badge from "@/components/atoms/badge/badge";
import { PedidoEstadoText } from "@/components/atoms/pedidos/pedido-estado-text/pedido-estado-text";
import { formatPedidoFecha, PEDIDO_CANAL_BADGE } from "@/lib/portal-pedidos";
import { PEDIDO_CANAL_LABELS, type PedidoNormalizado } from "@/types/portal-pedidos";
import styles from "./pedido-detalle-header.module.scss";

/** Encabezado del detalle: último estado como título, canal y fecha. */
export function PedidoDetalleHeader({ pedido }: { pedido: PedidoNormalizado }) {
  return (
    <div>
      <h2 className={styles.title}>
        <PedidoEstadoText idEstado={pedido.id_estado} />
      </h2>
      <div className={styles.meta}>
        <Badge {...PEDIDO_CANAL_BADGE[pedido.canal]} size="md">
          {PEDIDO_CANAL_LABELS[pedido.canal]}
        </Badge>
        <span className={styles.date}>Realizado el {formatPedidoFecha(pedido.fecha)}</span>
      </div>
    </div>
  );
}
