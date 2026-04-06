"use client";

import * as React from "react";
import { ShoppingCart, Package } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import styles from "./pedidoAccordion.module.scss";

export type PedidoItem = {
  id: string;
  nombre: string;
  laboratorio: string;
  cantidad: number;
  checked: boolean;
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

        <AccordionContent className={styles.content}>
          <div className={styles.list}>
            {localItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <div className={styles.row}>
                  <div className={styles.iconBox}>
                    <Package size={20} className={styles.productIcon} />
                  </div>

                  <div className={styles.info}>
                    <p className={styles.name}>{item.nombre}</p>
                    <p className={styles.brand}>{item.laboratorio}</p>
                    <p className={styles.qty}>Cantidad: {item.cantidad}</p>
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
