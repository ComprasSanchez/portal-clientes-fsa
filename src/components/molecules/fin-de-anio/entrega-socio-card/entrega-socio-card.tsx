import { IdCard, Mail, Phone, UserRound } from "lucide-react";
import ListaRegalos from "@/components/molecules/fin-de-anio/lista-regalos/lista-regalos";
import { dniConPuntos, type EntregaAgrupada } from "@/lib/entrega-regalos";
import styles from "./entrega-socio-card.module.scss";

const hora = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("es-AR", {
        timeZone: "America/Argentina/Cordoba",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso))
    : "";

/** Una entrega: a quién (nombre, DNI, contacto) y qué se llevó. */
export default function EntregaSocioCard({ entrega }: { entrega: EntregaAgrupada }) {
  const { socio } = entrega;
  return (
    <article className={styles.card}>
      <header className={styles.cabecera}>
        <span className={styles.avatar} aria-hidden>
          <UserRound size={18} />
        </span>
        <strong className={styles.nombre}>{socio?.nombre ?? "Socio sin datos"}</strong>
        <span className={styles.hora}>{hora(entrega.retiradoAt)}</span>
      </header>

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
    </article>
  );
}
