"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./pedido-detalle-drawer.module.scss";

type PedidoDetalleDrawerProps = {
  open: boolean;
  /** Barra fija arriba del cajón (ej. "‹ Detalle del pedido"). */
  header: ReactNode;
  children: ReactNode;
};

/** Solo celular: cajón a pantalla completa con el detalle del pedido. */
export function PedidoDetalleDrawer({ open, header, children }: PedidoDetalleDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.drawer}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.3 }}
        >
          <div className={styles.header}>{header}</div>
          <div className={styles.content}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
