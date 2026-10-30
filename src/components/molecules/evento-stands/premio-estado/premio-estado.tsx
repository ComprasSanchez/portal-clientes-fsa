import { Gift, Lock, PartyPopper } from "lucide-react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./premio-estado.module.scss";

export type EstadoPremio = "bloqueado" | "habilitado" | "entregado";

type PremioEstadoProps = {
  estado: EstadoPremio;
  title: string;
  text: string;
  tone?: UiTone;
};

const ICONOS = { bloqueado: Lock, habilitado: PartyPopper, entregado: Gift };

/** Encabezado de la tarjeta del premio: ícono según el estado, título y texto. */
export default function PremioEstado({ estado, title, text, tone = "socios" }: PremioEstadoProps) {
  const Icono = ICONOS[estado];
  return (
    <div className={`${styles.wrap} ${toneClass(tone)}`}>
      <div className={styles.header}>
        <span className={`${styles.icon} ${styles[estado]}`} aria-hidden>
          <Icono size={22} />
        </span>
        <p className={styles.title}>{title}</p>
      </div>
      <p className={styles.text}>{text}</p>
    </div>
  );
}
