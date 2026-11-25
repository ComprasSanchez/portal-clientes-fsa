import TourPildora from "@/components/molecules/fin-de-anio/tour-pildora/tour-pildora";
import styles from "./tour-parada-card.module.scss";

type TourParadaCardProps = {
  pildora: string;
  /** Título grande (ej. "Sucursal N° 5"); opcional. */
  titulo?: string;
  lineas: string[];
  className?: string;
};

/** Tarjeta teal del tour: estado de Papá Noel o la próxima parada. */
export default function TourParadaCard({ pildora, titulo, lineas, className = "" }: TourParadaCardProps) {
  return (
    <section className={`${styles.card} ${className}`}>
      <TourPildora>{pildora}</TourPildora>
      {titulo && <h3 className={styles.titulo}>{titulo}</h3>}
      <div className={`${styles.lineas} ${titulo ? "" : styles.sinTitulo}`}>
        {lineas.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
    </section>
  );
}
