import type { PedidoProducto } from "@/types/portal-pedidos";
import styles from "./pedido-productos-list.module.scss";

export function PedidoProductosList({ productos }: { productos: PedidoProducto[] }) {
  return (
    <div className={styles.list}>
      {productos.map((prod) => (
        <div key={prod.product_id} className={styles.row}>
          <div className={styles.rowInner}>
            <div className="min-w-0">
              <p className={styles.value}>{prod.producto ?? "Producto"}</p>
              {prod.presentacion && <p className={styles.label}>{prod.presentacion}</p>}
            </div>
            <span className={styles.qty}>x{prod.qty}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
