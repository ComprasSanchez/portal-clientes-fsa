import styles from "./beauty-hero.module.scss";

type BeautyHeroProps = {
  marcas: string[];
  bajada: string;
};

/** Banner bordó del catálogo: "AutoBeauty junto a ..." y bajada en pastilla. */
export default function BeautyHero({ marcas, bajada }: BeautyHeroProps) {
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
      </div>
    </section>
  );
}
