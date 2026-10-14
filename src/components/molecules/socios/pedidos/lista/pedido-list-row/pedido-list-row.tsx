import Link from "next/link";
import { Store, Truck } from "lucide-react";
import { formatPortalCurrency } from "@/lib/portal-compras";
import {
  getPedidoEntregaLabel,
  getPedidoHref,
  getPedidoProductosResumen,
  isPedidoRetiro,
  PEDIDO_CANAL_BADGE,
} from "@/lib/portal-pedidos";
import {
  PEDIDO_CANAL_LABELS,
  type PedidoCanal,
  type PedidoNormalizado,
} from "@/types/portal-pedidos";
import Badge from "@/components/atoms/badge/badge";
import { PedidoEstadoText } from "@/components/atoms/pedidos/pedido-estado-text/pedido-estado-text";
import styles from "./pedido-list-row.module.scss";

const ICON_CLASS: Record<PedidoCanal, string> = {
  FARMA: styles.iconFarma,
  BREVE: styles.iconBreve,
  CORA: styles.iconCora,
};

export function PedidoListRow({ pedido }: { pedido: PedidoNormalizado }) {
  const productos = getPedidoProductosResumen(pedido);

  return (
    <div className={styles.row}>
      <div className={`${styles.icon} ${ICON_CLASS[pedido.canal]}`}>
        {isPedidoRetiro(pedido) ? <Store size={22} /> : <Truck size={22} />}
      </div>

      <div className={styles.info}>
        <div className={styles.estadoRow}>
          <PedidoEstadoText idEstado={pedido.id_estado} />
          <Badge {...PEDIDO_CANAL_BADGE[pedido.canal]}>{PEDIDO_CANAL_LABELS[pedido.canal]}</Badge>
        </div>
        <p className={styles.title}>{getPedidoEntregaLabel(pedido)}</p>
        {productos && <p className={styles.products}>{productos}</p>}
      </div>

      <p className={styles.amount}>{formatPortalCurrency(pedido.importe)}</p>

      <Link href={getPedidoHref(pedido.id_pedido)} scroll={false} className={styles.action}>
        Ver pedido
      </Link>
    </div>
  );
}
