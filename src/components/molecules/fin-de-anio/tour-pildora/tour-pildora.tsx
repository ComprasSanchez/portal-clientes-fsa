import type { ReactNode } from "react";
import styles from "./tour-pildora.module.scss";

type TourPildoraProps = {
  children: ReactNode;
  /** `llena`: amarilla (lo importante). `contorno`: solo borde. `apagada`: lo que ya pasó. */
  variante?: "llena" | "contorno" | "apagada";
  className?: string;
};

/** Etiqueta del tour de Papá Noel: "Próxima parada", "Sigue", etc. */
export default function TourPildora({ children, variante = "llena", className = "" }: TourPildoraProps) {
  return <span className={`${styles.pildora} ${styles[variante]} ${className}`}>{children}</span>;
}
