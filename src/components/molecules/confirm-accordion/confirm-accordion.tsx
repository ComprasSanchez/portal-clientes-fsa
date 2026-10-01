"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatPortalCurrency } from "@/lib/portal-compras";
import PriceTag from "@/components/atoms/price-tag/price-tag";
import styles from "./confirmAccordion.module.scss";

export type ConfirmProductItem = {
  id: string;
  nombre: string;
  laboratorio: string;
  cantidad: number;
  precio: number | null;
  precioBase: number | null;
  descuentoPct: number;
  recurring: boolean;
};

type ConfirmProductsAccordionProps = {
  title?: string;
  items: ConfirmProductItem[];
  defaultOpen?: boolean;
  onRemove?: (id: string) => void;
  onChangeQuantity?: (id: string, delta: number) => void;
};

export default function ConfirmProductsAccordion({
  title = "Productos seleccionados",
  items,
  defaultOpen = true,
  onRemove,
  onChangeQuantity,
}: ConfirmProductsAccordionProps) {
  const total = items.reduce(
    (sum, item) => sum + (item.precio ?? 0) * item.cantidad,
    0,
  );
  const hayAlgunPrecio = items.some((item) => typeof item.precio === "number");

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? "productos" : undefined}
      className={styles.accordion}
    >
      <AccordionItem value="productos" className={styles.item}>
        <AccordionTrigger className={styles.trigger}>
          <div className={styles.triggerLeft}>
            <span className={styles.title}>{title}</span>
          </div>
        </AccordionTrigger>

        <AccordionContent className={`h-auto ${styles.content}`}>
          <div className={styles.list}>
            {items.map((item, index) => (
              <div key={item.id} className={styles.rowWrapper}>
                <div className={styles.row}>
                  <div className={styles.nameArea}>
                    <div className={styles.productLine}>
                      <p className={styles.name}>{item.nombre}</p>
                    </div>
                  </div>

                  {onRemove && (
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => onRemove(item.id)}
                      aria-label={`Quitar ${item.nombre}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}

                  <p className={styles.brand}>{item.laboratorio}</p>

                  <div className={styles.footerRow}>
                    <div className={styles.qtyArea}>
                      {onChangeQuantity ? (
                        <div className={styles.qtyStepper}>
                          <button
                            type="button"
                            onClick={() => onChangeQuantity(item.id, -1)}
                            aria-label={`Quitar una unidad de ${item.nombre}`}
                            className={styles.qtyStepperBtn}
                          >
                            <Minus size={18} />
                          </button>
                          <span className={styles.qtyStepperValue}>
                            {item.cantidad}un.
                          </span>
                          <button
                            type="button"
                            onClick={() => onChangeQuantity(item.id, 1)}
                            aria-label={`Agregar una unidad de ${item.nombre}`}
                            className={styles.qtyStepperBtn}
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className={styles.qty}>{item.cantidad}un.</span>
                      )}
                    </div>

                    <div className={styles.priceArea}>
                      <PriceTag
                        precio={item.precio}
                        precioBase={item.precioBase}
                        descuentoPct={item.descuentoPct}
                        cantidad={item.cantidad}
                        align="end"
                      />
                    </div>
                  </div>
                </div>

                {index < items.length - 1 && <div className={styles.divider} />}
              </div>
            ))}
          </div>

          {hayAlgunPrecio && (
            <div className={styles.footer}>
              <span className={styles.footerLabel}>Total</span>
              <span className={styles.footerTotal}>
                {formatPortalCurrency(total)}
              </span>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}