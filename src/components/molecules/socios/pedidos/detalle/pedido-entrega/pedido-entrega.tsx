import { MapPin, Store, Truck } from "lucide-react";
import { getPedidoEntregaLabel, isPedidoRetiro } from "@/lib/portal-pedidos";
import type { PedidoNormalizado } from "@/types/portal-pedidos";
import styles from "./pedido-entrega.module.scss";

export function PedidoEntrega({ pedido }: { pedido: PedidoNormalizado }) {
  const isRetiro = isPedidoRetiro(pedido);

  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>
        {isRetiro ? <Store size={18} /> : <Truck size={18} />}
      </div>
      <div className="min-w-0">
        <p className={styles.title}>{getPedidoEntregaLabel(pedido)}</p>
        {!isRetiro && pedido.domicilio && (
          <p className={styles.address}>
            <MapPin size={13} className="mt-0.5 shrink-0" />
            {pedido.domicilio}
          </p>
        )}
      </div>
    </div>
  );
}
