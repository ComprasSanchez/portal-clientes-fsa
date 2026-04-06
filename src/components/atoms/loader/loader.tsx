"use client";

import Image from "next/image";
import styles from "./loader.module.scss";

import backgroundImage from "@/assets/background.png";
import footerImage from "@/assets/farmacia-logo.svg";
import logoCoraImage from "@/assets/logo-cora.png";

type PortalLoaderProps = {
  backgroundSrc?: string;
  logoSrc?: string;
  footerSrc?: string;
  altPrefix?: string;
};

export function Loader({
  backgroundSrc = backgroundImage.src,
  logoSrc = logoCoraImage.src,
  footerSrc = footerImage.src,
  altPrefix = "CORA loader",
}: PortalLoaderProps) {
  return (
    <div className={styles.loader}>
      <div className={styles.background}>
        <Image
          src={backgroundSrc}
          alt={`${altPrefix} background`}
          fill
          priority
          className={styles.backgroundImage}
        />
      </div>

      <div className={styles.centerContent}>
        <div className={styles.hero}>
          <div className={styles.logoImageWrap}>
            <Image
              src={logoSrc}
              alt={`${altPrefix} logo`}
              width={100}
              height={100}
              className={styles.logoImage}
              priority
            />
          </div>

          <h1 className={styles.title}>CORA</h1>

          <div className={styles.bubble}>
            Hola, soy CORA y te ayudo a organizar tu pedido.
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <Image
          src={footerSrc}
          alt={`${altPrefix} footer`}
          width={170}
          height={44}
          className={styles.footerImage}
          priority
        />
      </div>
    </div>
  );
}

export default Loader;
