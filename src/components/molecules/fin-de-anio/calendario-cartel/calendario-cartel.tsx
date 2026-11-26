import Image from "next/image";
import sociosaBlanco from "@/assets/sociosa-blanco.png";
import farmaciaLogo from "@/assets/farmacia-logo.svg";
import estrella from "@/assets/icono-estrella.png";
import styles from "./calendario-cartel.module.scss";

type CalendarioCartelProps = {
  variante: "titulo" | "anio-nuevo";
  /** Ubicación en la grilla, la pone el organismo. */
  className?: string;
};

/** Carteles fijos del calendario: el título y el cierre de "Feliz año nuevo". */
export default function CalendarioCartel({ variante, className = "" }: CalendarioCartelProps) {
  if (variante === "titulo") {
    return (
      <div className={`${styles.cartel} ${styles.titulo} ${className}`}>
        <Image src={sociosaBlanco} alt="SocioSA" className={styles.logo} />
        <h2 className={styles.calendario}>Calendario</h2>
        <span className={styles.pill}>de regalos</span>
      </div>
    );
  }

  return (
    <div className={`${styles.cartel} ${styles.anioNuevo} ${className}`}>
      <Image src={farmaciaLogo} alt="Farmacias Sánchez Antoniolli" className={styles.logoFarmacia} />
      <Image src={estrella} alt="" aria-hidden className={styles.estrella} />
      <div className={styles.saludo}>
        <span className={styles.feliz}>Feliz año</span>
        <div className={styles.filaNuevo}>
          <span className={styles.pillChica}>Bienvenido 2027</span>
          <span className={styles.nuevo}>Nuevo!</span>
        </div>
      </div>
    </div>
  );
}
