"use client";

import { ShoppingCart } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import styles from "./confirmAccordion.module.scss";

export type ConfirmProductItem = {
  id: string;
  nombre: string;
  laboratorio: string;
  cantidad: number;
};

type ConfirmProductsAccordionProps = {
  title?: string;
  items: ConfirmProductItem[];
  defaultOpen?: boolean;
};

export default function ConfirmProductsAccordion({
  title = "Productos seleccionados",
  items,
  defaultOpen = true,
}: ConfirmProductsAccordionProps) {
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
            {/* <ShoppingCart size={18} className={styles.icon} /> */}
            <span className={styles.title}>{title}</span>
          </div>
        </AccordionTrigger>

        <AccordionContent className={styles.content}>
          <div className={styles.list}>
            {items.map((item, index) => (
              <div key={item.id} className={styles.rowWrapper}>
                <div className={styles.row}>
                  <div className={styles.left}>
                    <div className={styles.productLine}>
                      <ShoppingCart size={14} className={styles.smallIcon} />
                      <p className={styles.name}>{item.nombre}</p>
                    </div>

                    <p className={styles.brand}>{item.laboratorio}</p>
                  </div>

                  <div className={styles.right}>
                    <span className={styles.qty}>{item.cantidad}un.</span>
                  </div>
                </div>

                {index < items.length - 1 && <div className={styles.divider} />}
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}