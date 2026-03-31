"use client";

import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./header.module.scss";

type PortalHeaderProps = {
  cartCount?: number;
  showBackButton?: boolean;
  onCartClick?: () => void;
};

export default function PortalHeader({
  cartCount = 0,
  showBackButton = true,
  onCartClick,
}: PortalHeaderProps) {
  const router = useRouter();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.side}>
          {showBackButton ? (
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => router.back()}
              aria-label="Volver"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div className={styles.placeholder} />
          )}
        </div>

        <div className={styles.brand}>
          <h1 className={styles.logo}>CORA</h1>
        </div>

        <div className={styles.side}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onCartClick}
            aria-label="Carrito"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </button>
        </div>
      </div>

      <div className={styles.tagline}>te acompaña</div>
    </header>
  );
}
