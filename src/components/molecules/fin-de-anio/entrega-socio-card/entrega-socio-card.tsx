import { ChevronDown, IdCard, Mail, Phone, UserRound } from "lucide-react";
import ListaRegalos from "@/components/molecules/fin-de-anio/lista-regalos/lista-regalos";
import { dniConPuntos, type EntregaAgrupada } from "@/lib/entrega-regalos";
import styles from "./entrega-socio-card.module.scss";

type EntregaSocioCardProps = {
  entrega: EntregaAgrupada;
  abierta: boolean;
  onToggle: () => void;
};

const hora = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("es-AR", {
        timeZone: "America/Argentina/Cordoba",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso))
    : "";

/** Una entrega en una línea (nombre, cantidad, hora); al tocarla muestra DNI, contacto y regalos. */
export default function EntregaSocioCard({ entrega, abierta, onToggle }: EntregaSocioCardProps) {
  const { socio } = entrega;
  const n = entrega.regalos.length;
  return (
    <article className={`${styles.card} ${abierta ? styles.abierta : ""}`}>
      <button type="button" className={styles.fila} onClick={onToggle} aria-expanded={abierta}>
        <span className={styles.avatar} aria-hidden>
          <UserRound size={16} />
        </span>
        <span className={styles.resumen}>
          <strong className={styles.nombre}>{socio?.nombre ?? "Socio sin datos"}</strong>
          <span className={styles.meta}>
            {n === 1 ? "1 regalo" : `${n} regalos`} · {hora(entrega.retiradoAt)}
          </span>
        </span>
        <ChevronDown size={18} className={styles.flecha} aria-hidden />
      </button>

      {abierta && (
        <div className={styles.detalle}>
          {socio && (socio.dni || socio.telefono || socio.email) && (
            <ul className={styles.datos}>
              {socio.dni && (
                <li>
                  <IdCard size={15} aria-hidden /> DNI {dniConPuntos(socio.dni)}
                </li>
              )}
              {socio.telefono && (
                <li>
                  <Phone size={15} aria-hidden /> <a href={`tel:${socio.telefono}`}>{socio.telefono}</a>
                </li>
              )}
              {socio.email && (
                <li>
                  <Mail size={15} aria-hidden /> <a href={`mailto:${socio.email}`}>{socio.email}</a>
                </li>
              )}
            </ul>
          )}
          <ListaRegalos regalos={entrega.regalos} />
        </div>
      )}
    </article>
  );
}
