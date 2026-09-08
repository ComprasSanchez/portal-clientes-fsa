"use client";

import { ArrowLeft, Menu, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./header.module.scss";

type PortalHeaderProps = {
  cartCount?: number;
  showBackButton?: boolean;
  showCart?: boolean;
  onCartClick?: () => void;
  onBack?: () => void;
  onMenuClick?: () => void;
};


export default function PortalHeader({
  cartCount = 0,
  showBackButton = true,
  showCart = true,
  onCartClick,
  onBack,
  onMenuClick,
}: PortalHeaderProps) {
  const router = useRouter();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.side}>
          {onMenuClick ? (
            // Cuando este header vive embebido en /cora, el acceso al
            // sidebar (☰) tiene prioridad siempre — nunca lo tapa la flecha
            // de "volver" del wizard, que en ese caso se muestra junto al
            // título de cada paso en el cuerpo en su lugar. En desktop el
            // sidebar ya queda fijo/visible (mismo breakpoint que Sidebar.tsx),
            // así que ahí el botón no hace falta.
            <button
              type="button"
              className={`${styles.iconButton} ${styles.menuButtonMobileOnly}`}
              onClick={onMenuClick}
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
          ) : showBackButton ? (
            <button
              type="button"
              className={styles.iconButton}
              onClick={onBack ? onBack : () => router.back()}
              aria-label="Volver"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div className={styles.placeholder} />
          )}
        </div>

        <div className={styles.brand}>
          <button
            type="button"
            className={styles.logoButton}
            onClick={() => router.push("/cora")}
            aria-label="Volver a CORA"
          >
            <h1 className={styles.logo}>CORA</h1>
          </button>
        </div>

        <div className={styles.side}>
          {showCart ? (
            <button
              type="button"
              className={styles.iconButton}
              onClick={onCartClick}
              aria-label="Carrito"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
            </button>
          ) : (
            <div className={styles.placeholder} />
          )}
        </div>
      </div>

      <div className={styles.tagline}>te acompaña</div>
    </header>
  );
}
