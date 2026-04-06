"use client";

import { ShoppingCart, Trash2, X } from "lucide-react";
import styles from "./cartView.module.scss";
import PortalButton from "@/components/atoms/button/button";

export type CartViewItem = {
  id: string;
  nombre: string;
  laboratorio: string;
  cantidad?: number;
};

type CartViewProps = {
  open: boolean;
  items: CartViewItem[];
  title?: string;
  onClose: () => void;
  onRemove: (id: string) => void;
  onChat?: () => void;
};

export default function CartView({
  open,
  items,
  title = "Mi pedido",
  onClose,
  onRemove,
  onChat,
}: CartViewProps) {
    
  return (
    <div className={open ? `${styles.overlay} ${styles.open}` : styles.overlay}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <ShoppingCart size={28} className={styles.cartIcon} />
            <h2 className={styles.title}>{title}</h2>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar carrito"
          >
            <X size={34} strokeWidth={2.6} />
          </button>
        </header>

        <section className={styles.body}>
          <div className={styles.card}>
            {items.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>No agregaste productos todavía</p>
                <p className={styles.emptyText}>
                  Cuando selecciones productos, los vas a ver acá.
                </p>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={item.id} className={styles.itemWrapper}>
                  <div className={styles.itemRow}>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{item.nombre}</p>
                      <p className={styles.itemBrand}>{item.laboratorio}</p>

                      {typeof item.cantidad === "number" && (
                        <p className={styles.itemQty}>Cantidad: {item.cantidad}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => onRemove(item.id)}
                      aria-label={`Eliminar ${item.nombre}`}
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>

                  {index < items.length - 1 && <div className={styles.divider} />}
                </div>
              ))
            )}
          </div>

          <div className={styles.chatWrap}>
            <PortalButton variant="secondary" withChatIcon onClick={onChat}>
              Hablar con CORA
            </PortalButton>
          </div>
        </section>
      </div>
    </div>
  );
}