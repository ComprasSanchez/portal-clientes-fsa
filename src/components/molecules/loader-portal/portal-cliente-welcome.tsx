"use client";

import Image from "next/image";
import PortalButton from "@/components/atoms/button/button";
import backgroundImage from "@/assets/background.png";
import footerImage from "@/assets/farmacia-logo.svg";
import logoCoraImage from "@/assets/logo-cora.png";
import styles from "./portal-cliente-welcome.module.scss";

type PortalClienteWelcomeProps = {
  onContinue: () => void;
};

export default function PortalClienteWelcome({
  onContinue,
}: PortalClienteWelcomeProps) {
  return (
    <section className={styles.screen}>
      <div className={styles.background}>
        <Image
          src={backgroundImage}
          alt="Fondo CORA"
          fill
          priority
          className={styles.backgroundImage}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.hero}>
          <div className={styles.logoImageWrap}>
            <Image
              src={logoCoraImage}
              alt="Logo CORA"
              width={240}
              height={240}
              className={styles.logoImage}
              priority
            />
            <div className={styles.bubble}>
              Hola, soy CORA y te ayudo a organizar tu pedido.
            </div>
          </div>

          <h1 className={styles.title}>CORA</h1>
        </div>

        <div className={styles.actions}>
          <PortalButton variant="primary" onClick={onContinue}>
            Ingresar al portal
          </PortalButton>
        </div>
      </div>

      <div className={styles.footer}>
        <Image
          src={footerImage}
          alt="Farmacias Sanchez Antoniolli"
          width={154}
          height={42}
          className={styles.footerImage}
          priority
        />
      </div>
    </section>
  );
}