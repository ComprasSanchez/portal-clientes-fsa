import type { ReactNode } from "react";
import Card from "@/components/atoms/card/card";
import styles from "./pedidos-fecha-group.module.scss";

/** Tarjeta que agrupa los pedidos de un mismo día, con la fecha como encabezado. */
export function PedidosFechaGroup({
  fecha,
  children,
}: {
  fecha: string;
  children: ReactNode;
}) {
  return (
    <Card padding="none">
      <header className={styles.header}>
        <p className={styles.date}>{fecha}</p>
      </header>
      {children}
    </Card>
  );
}
