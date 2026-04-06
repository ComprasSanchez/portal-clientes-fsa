"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import styles from "./order-processing-loader.module.scss";

import backgroundImage from "@/assets/background.png";
import footerImage from "@/assets/farmacia-logo.svg";

export default function OrderProcessingLoader() {
  return (
    <div className={styles.loader}>
      <div className={styles.background}>
        <Image
          src={backgroundImage}
          alt="Procesando pedido"
          fill
          priority
          className={styles.backgroundImage}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.badge}>
          <div className={styles.orbit} aria-hidden="true">
            <svg viewBox="0 0 120 120" className={styles.orbitSvg}>
              <path
                d="M36 49 A28 28 0 0 1 78 36"
                className={styles.orbitPath}
                stroke="#f4b62a"
              />
              <path d="M70 27 L82 33 L72 42" className={styles.orbitHead} stroke="#f4b62a" />

              <path
                d="M84 71 A28 28 0 0 1 42 84"
                className={styles.orbitPath}
                stroke="#f4b62a"
              />
              <path d="M50 93 L38 87 L48 78" className={styles.orbitHead} stroke="#f4b62a" />
            </svg>
          </div>

          <div className={styles.cartWrap}>
            <ShoppingCart
              size={30}
              strokeWidth={2.2}
              className={styles.cartIcon}
            />
          </div>
        </div>

        <h1 className={styles.title}>Estoy procesando tu pedido</h1>
        <p className={styles.subtitle}>
          En unos segundos te voy a mostrar el número de orden.
        </p>
      </div>

      <div className={styles.footer}>
        <Image
          src={footerImage}
          alt="Farmacias Sanchez Antoniolli"
          width={170}
          height={44}
          priority
          className={styles.footerImage}
        />
      </div>
    </div>
  );
}
