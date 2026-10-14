import { formatPortalCurrency } from "@/lib/portal-compras";
import { getPedidoUnidades } from "@/lib/portal-pedidos";
import type { PedidoNormalizado } from "@/types/portal-pedidos";
import styles from "./pedido-resumen.module.scss";

export function PedidoResumen({ pedido }: { pedido: PedidoNormalizado }) {
  const unidades = getPedidoUnidades(pedido);

  return (
    <div>
      {unidades > 0 && (
        <div className={styles.line}>
          <span>Productos</span>
          <span>
            {unidades} {unidades === 1 ? "unidad" : "unidades"}
          </span>
        </div>
      )}
      <div className={styles.total}>
        <span className={styles.totalLabel}>Total</span>
        <span className={styles.totalAmount}>{formatPortalCurrency(pedido.importe)}</span>
      </div>
    </div>
  );
}
