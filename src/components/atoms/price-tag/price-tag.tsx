import { formatPortalCurrency } from "@/lib/portal-compras";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./priceTag.module.scss";

type PriceTagProps = {
  precio: number | null | undefined;
  precioBase?: number | null;
  descuentoPct?: number;
  cantidad?: number;
  align?: "start" | "end";
  /** Texto antes del precio tachado (ej. "Antes"). */
  basePrefix?: string;
  /** `lg`: precio final grande, para tarjetas de catálogo. */
  size?: "md" | "lg";
  /** Oculta la pastilla "-X%" (cuando ya se muestra en otro lado). */
  showBadge?: boolean;
  /** Redondea a pesos enteros. */
  sinDecimales?: boolean;
  /** Con tema, toma los colores de `var(--tone-*)`; sin tema queda el violeta de CORA. */
  tone?: UiTone;
};

export default function PriceTag({
  precio,
  precioBase,
  descuentoPct,
  cantidad = 1,
  align = "start",
  basePrefix,
  size = "md",
  showBadge = true,
  sinDecimales = false,
  tone,
}: PriceTagProps) {
  if (typeof precio !== "number") return null;

  const hayDescuento =
    typeof descuentoPct === "number" &&
    descuentoPct > 0 &&
    typeof precioBase === "number" &&
    precioBase > precio;

  const formato = (monto: number) =>
    formatPortalCurrency(monto * cantidad, "ARS", sinDecimales);

  return (
    <div
      className={`${styles.wrap} ${align === "end" ? styles.alignEnd : ""} ${
        size === "lg" ? styles.lg : ""
      } ${tone ? `${styles.toned} ${toneClass(tone)}` : ""}`}
    >
      {hayDescuento && (
        <span className={styles.base}>
          {basePrefix && <span className={styles.basePrefix}>{basePrefix} </span>}
          <s>{formato(precioBase as number)}</s>
        </span>
      )}
      <div className={styles.finalRow}>
        <span className={styles.final}>{formato(precio)}</span>
        {hayDescuento && showBadge && (
          <span className={styles.badge}>-{Math.round(descuentoPct as number)}%</span>
        )}
      </div>
    </div>
  );
}
