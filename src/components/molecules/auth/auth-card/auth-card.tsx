import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import BackButton from "@/components/atoms/back-button/back-button";
import logo from "@/assets/logo-celeste.png";
import portada from "@/assets/portada-prueba-20.jpeg";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./auth-card.module.scss";

type AuthCardProps = {
  title: string;
  subtitle?: ReactNode;
  /** Sin valor no se muestra la flecha de volver (primer paso). */
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  tone?: UiTone;
};

/**
 * Marco de cada paso del ingreso y el registro (mismo estilo que la app): logo,
 * volver, título y contenido. En celular sin recuadro; en escritorio con la
 * imagen del portal a la izquierda y el formulario en una tarjeta.
 */
export default function AuthCard({
  title,
  subtitle,
  onBack,
  children,
  footer,
  tone = "socios",
}: AuthCardProps) {
  return (
    <section className={`${styles.root} ${toneClass(tone)}`}>
      <aside className={styles.hero} aria-hidden>
        <Image src={portada} alt="" fill priority className={styles.heroImage} />
      </aside>

      <div className={styles.content}>
        <div className={styles.panel}>
          <div className={styles.top}>
            {onBack && (
              <span className={styles.back}>
                <BackButton ariaLabel="Volver" onClick={onBack} tone={tone} variant="boxed" />
              </span>
            )}
            <Image
              src={logo}
              alt="Farmacias Sanchez Antoniolli"
              className={styles.logo}
              priority
            />
          </div>

          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          <div className={styles.body}>{children}</div>
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>

        <Link href="/politica-de-privacidad" className={styles.legal}>
          Política de privacidad
        </Link>
      </div>
    </section>
  );
}
