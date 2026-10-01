import { formatPortalCurrency } from "@/lib/portal-compras";
import styles from "./priceTag.module.scss";

type PriceTagProps = {
  precio: number | null | undefined;
  precioBase?: number | null;
  descuentoPct?: number;
  cantidad?: number;
  align?: "start" | "end";
};

export default function PriceTag({
  precio,
  precioBase,
  descuentoPct,
  cantidad = 1,
  align = "start",
}: PriceTagProps) {
  if (typeof precio !== "number") return null;

  const hayDescuento =
    typeof descuentoPct === "number" &&
    descuentoPct > 0 &&
    typeof precioBase === "number" &&
    precioBase > precio;

  return (
    <div className={`${styles.wrap} ${align === "end" ? styles.alignEnd : ""}`}>
      {hayDescuento && (
        <span className={styles.base}>
          {formatPortalCurrency((precioBase as number) * cantidad)}
        </span>
      )}
      <div className={styles.finalRow}>
        <span className={styles.final}>
          {formatPortalCurrency(precio * cantidad)}
        </span>
        {hayDescuento && (
          <span className={styles.badge}>-{Math.round(descuentoPct as number)}%</span>
        )}
      </div>
    </div>
  );
}
