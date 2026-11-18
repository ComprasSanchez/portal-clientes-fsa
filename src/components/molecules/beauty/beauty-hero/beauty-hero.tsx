import { CalendarDays, MapPin } from "lucide-react";
import styles from "./beauty-hero.module.scss";

type BeautyHeroProps = {
  marcas: string[];
  bajada: string;
  fecha?: string;
  lugar?: string;
};

/** Banner bordó del catálogo: "AutoBeauty junto a ...", bajada en pastilla, fecha y lugar. */
export default function BeautyHero({ marcas, bajada, fecha, lugar }: BeautyHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="beauty-hero-title">
      <div className={styles.inner}>
        <h1 id="beauty-hero-title" className={styles.logo}>
          <span className={styles.spark} aria-hidden="true">
            ✦
          </span>
          AutoBeauty
        </h1>
        <p className={styles.partners}>
          <span className={styles.junto}>junto a</span>{" "}
          {marcas.map((marca, i) => (
            <span key={marca} className={styles.marca}>
              {i > 0 && <span className={styles.plus}>+ </span>}
              {marca}
            </span>
          ))}
        </p>
        <p className={styles.bajada}>{bajada}</p>
        {(fecha || lugar) && (
          <p className={styles.detalle}>
            {fecha && (
              <span className={styles.dato}>
                <CalendarDays size={16} aria-hidden="true" />
                {fecha}
              </span>
            )}
            {lugar && (
              <span className={styles.dato}>
                <MapPin size={16} aria-hidden="true" />
                {lugar}
              </span>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
