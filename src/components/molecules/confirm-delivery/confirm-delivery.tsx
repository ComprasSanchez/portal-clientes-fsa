"use client";

import { Home, Store } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import styles from "./confirmDelivery.module.scss";

export type ConfirmDeliveryData = {
  tipo: "domicilio" | "sucursal";
  direccion: string;
  detalle?: string;
};

type ConfirmDeliveryAccordionProps = {
  title?: string;
  data: ConfirmDeliveryData;
  defaultOpen?: boolean;
};

export default function ConfirmDeliveryAccordion({
  title = "Recibo/retiro en:",
  data,
  defaultOpen = true,
}: ConfirmDeliveryAccordionProps) {
  const MainIcon = data.tipo === "domicilio" ? Home : Store;

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? "entrega" : undefined}
      className={styles.accordion}
    >
      <AccordionItem value="entrega" className={styles.item}>
        <AccordionTrigger className={styles.trigger}>
          <div className={styles.triggerLeft}>
            {/* <MainIcon size={18} className={styles.icon} /> */}
            <span className={styles.title}>{title}</span>
          </div>
        </AccordionTrigger>

        <AccordionContent className={styles.content}>
          <div className={styles.addressRow}>
            <MainIcon size={16} className={styles.smallIcon} />

            <div className={styles.texts}>
              <p className={styles.address}>{data.direccion}</p>
              {data.detalle && <p className={styles.detail}>{data.detalle}</p>}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}