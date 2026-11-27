import { Gift } from "lucide-react";
import { textoRegalo } from "@/lib/fin-de-anio";
import type { CalendarioRegalo } from "@/types/portal-calendario";
import styles from "./lista-regalos.module.scss";

type ListaRegalosProps = {
  regalos: CalendarioRegalo[];
  /** Muestra la hora de entrega (pantalla del personal). */
  conHora?: boolean;
};

const hora = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("es-AR", {
        timeZone: "America/Argentina/Cordoba",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso))
    : "";

/** Regalos del calendario: qué es cada uno y de qué día. */
export default function ListaRegalos({ regalos, conHora = false }: ListaRegalosProps) {
  return (
    <ul className={styles.lista}>
      {regalos.map((r) => (
        <li key={`${r.fecha}-${r.origen}-${r.retiradoAt ?? ""}`} className={styles.item}>
          <span className={styles.icono} aria-hidden>
            <Gift size={18} />
          </span>
          <span className={styles.texto}>{textoRegalo(r)}</span>
          {conHora && <span className={styles.hora}>{hora(r.retiradoAt)}</span>}
        </li>
      ))}
    </ul>
  );
}
