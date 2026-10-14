import Link from "next/link";
import { MapPin, Truck } from "lucide-react";
import { formatPortalCurrency } from "@/lib/portal-compras";
import {
  formatPedidoFecha,
  getPedidoEntregaLabel,
  getPedidoHref,
  isPedidoRetiro,
  PEDIDO_CANAL_BADGE,
} from "@/lib/portal-pedidos";
import { PEDIDO_CANAL_LABELS, type PedidoNormalizado } from "@/types/portal-pedidos";
import Badge from "@/components/atoms/badge/badge";
import { PedidoEstadoText } from "@/components/atoms/pedidos/pedido-estado-text/pedido-estado-text";
import styles from "./pedido-list-card.module.scss";

/** Tarjeta de pedido en celular: último estado como título, canal, fecha, entrega y total. */
export function PedidoListCard({ pedido }: { pedido: PedidoNormalizado }) {
  const isRetiro = isPedidoRetiro(pedido);

  return (
    <Link href={getPedidoHref(pedido.id_pedido)} scroll={false} className={styles.card}>
      <div className={styles.topRow}>
        <PedidoEstadoText idEstado={pedido.id_estado} className={styles.estado} />
        <Badge {...PEDIDO_CANAL_BADGE[pedido.canal]}>{PEDIDO_CANAL_LABELS[pedido.canal]}</Badge>
      </div>
      <p className={styles.date}>{formatPedidoFecha(pedido.fecha)}</p>
      <div className={styles.bottomRow}>
        <div className={styles.meta}>
          {isRetiro ? <MapPin size={13} className="shrink-0" /> : <Truck size={13} className="shrink-0" />}
          <span>{isRetiro ? (pedido.nombre_sucursal ?? "Retiro en sucursal") : getPedidoEntregaLabel(pedido)}</span>
        </div>
        <span className={styles.amount}>{formatPortalCurrency(pedido.importe)}</span>
      </div>
    </Link>
  );
}
