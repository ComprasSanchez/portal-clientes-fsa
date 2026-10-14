import styles from "./pedido-info-adicional.module.scss";

export type PedidoInfoItem = {
  label: string;
  value: string;
};

/**
 * Datos sueltos del pedido (referencia de pago, observación...). Para sumar
 * información nueva (forma de pago, costo de envío) alcanza con agregar un item.
 */
export function PedidoInfoAdicional({ items }: { items: PedidoInfoItem[] }) {
  return (
    <div className={styles.list}>
      {items.map((item) => (
        <div key={item.label} className={styles.row}>
          <p className={styles.label}>{item.label}</p>
          <p className={styles.value}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
