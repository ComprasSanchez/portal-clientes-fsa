"use client";

import * as React from "react";
import { ShoppingCart } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { formatPortalCurrency } from "@/lib/portal-compras";
import PriceTag from "@/components/atoms/price-tag/price-tag";
import styles from "./pedidoAccordion.module.scss";

export type PedidoItem = {
  id: string;
  nombre: string;
  laboratorio: string;
  cantidad: number;
  checked: boolean;
  precio: number | null;
  precioBase: number | null;
  descuentoPct: number;
};

type PedidoAccordionProps = {
  items: PedidoItem[];
  title?: string;
  defaultOpen?: boolean;
  onToggle?: (id: string, checked: boolean) => void;
};

export default function PedidoAccordion({
  items,
  title = "Tu pedido",
  defaultOpen = true,
  onToggle,
}: PedidoAccordionProps) {
  const [localItems, setLocalItems] = React.useState(items);

  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleToggle = (id: string, checked: boolean) => {
    setLocalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked } : item)),
    );

    onToggle?.(id, checked);
  };

  const total = localItems
    .filter((item) => item.checked)
    .reduce((sum, item) => sum + (item.precio ?? 0) * item.cantidad, 0);
  const hayAlgunPrecio = localItems.some(
    (item) => item.checked && typeof item.precio === "number",
  );

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? "pedido" : undefined}
      className={styles.accordion}
    >
      <AccordionItem value="pedido" className={styles.item}>
        <AccordionTrigger className={styles.trigger}>
          <div className={styles.triggerLeft}>
            <ShoppingCart className={styles.cartIcon} size={22} />
            <span className={styles.title}>{title}</span>
          </div>
        </AccordionTrigger>

        <AccordionContent className={`h-auto ${styles.content}`}>
          <div className={styles.list}>
            {localItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <div className={styles.row}>
                  <div className={styles.info}>
                    <p className={styles.name}>{item.nombre}</p>
                    <p className={styles.brand}>{item.laboratorio}</p>
                    <PriceTag
                      precio={item.precio}
                      precioBase={item.precioBase}
                      descuentoPct={item.descuentoPct}
                      cantidad={item.cantidad}
                    />
                  </div>

                  <div className={styles.switchWrap}>
                    <Switch
                      checked={item.checked}
                      onCheckedChange={(checked) =>
                        handleToggle(item.id, checked)
                      }
                    />
                  </div>
                </div>

                {index < localItems.length - 1 && (
                  <div className={styles.divider} />
                )}
              </React.Fragment>
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
