import type { CSSProperties } from "react";
import Image, { type StaticImageData } from "next/image";
import styles from "./beauty-promos-bancarias.module.scss";

export type PromoBancaria = {
  imagen: StaticImageData;
  alt: string;
};

type BeautyPromosBancariasProps = {
  promos: PromoBancaria[];
};

/** Cierre del catálogo: "Promociones bancarias" con los banners de cuotas. */
const esApaisado = (promo: PromoBancaria) => promo.imagen.width / promo.imagen.height > 3;

export default function BeautyPromosBancarias({ promos }: BeautyPromosBancariasProps) {
  const columnas = Math.min(3, Math.max(1, promos.filter((p) => !esApaisado(p)).length));
  return (
    <section className={styles.promos} aria-labelledby="beauty-promos-title">
      <h2 id="beauty-promos-title" className={styles.title}>
        <span className={styles.strong}>Promociones</span> bancarias
      </h2>
      <div className={styles.lista} style={{ "--columnas": columnas } as CSSProperties}>
        {promos.map((promo) => {
          const apaisado = esApaisado(promo);
          return (
            <Image
              key={promo.alt}
              src={promo.imagen}
              alt={promo.alt}
              sizes={apaisado ? "100vw" : `(max-width: 640px) 100vw, ${Math.round(100 / columnas)}vw`}
              className={`${styles.banner} ${apaisado ? styles.ancho : ""}`}
            />
          );
        })}
      </div>
    </section>
  );
}
