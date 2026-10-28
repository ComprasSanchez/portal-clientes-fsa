import { Check, QrCode } from "lucide-react";
import { toneClass, type UiTone } from "@/types/ui-tone";
import type { PortalEventoStand } from "@/types/portal-evento-stands";
import styles from "./stand-grid.module.scss";

type StandGridProps = {
  stands: PortalEventoStand[];
  /** Stand recién escaneado, para resaltarlo. */
  destacado?: number | null;
  /** Al tocar un stand pendiente (abre el escáner). Sin valor, la lista no es clickeable. */
  onSelectPendiente?: () => void;
  tone?: UiTone;
};

/** Lista de los stands del evento en dos columnas: escaneados con tilde, pendientes con QR. */
export default function StandGrid({
  stands,
  destacado = null,
  onSelectPendiente,
  tone = "socios",
}: StandGridProps) {
  return (
    <ul className={`${styles.grid} ${toneClass(tone)}`}>
      {stands.map((s) => {
        const clickeable = !s.escaneado && !!onSelectPendiente;
        const contenido = (
          <>
            <span className={styles.number} aria-hidden>
              {String(s.numero).padStart(2, "0")}
            </span>
            <span className={styles.copy}>
              <span className={styles.name}>{s.nombre}</span>
              <span className={styles.status}>{s.escaneado ? "Escaneado" : "Pendiente"}</span>
            </span>
            <span className={styles.mark} aria-hidden>
              {s.escaneado ? <Check size={16} strokeWidth={3} /> : <QrCode size={16} />}
            </span>
          </>
        );

        return (
          <li
            key={s.numero}
            className={`${styles.item} ${s.escaneado ? styles.done : ""} ${
              destacado === s.numero ? styles.highlight : ""
            }`}
          >
            {clickeable ? (
              <button
                type="button"
                className={styles.row}
                onClick={onSelectPendiente}
                aria-label={`Escanear ${s.nombre}`}
              >
                {contenido}
              </button>
            ) : (
              <div
                className={styles.row}
                aria-label={`${s.nombre}: ${s.escaneado ? "escaneado" : "pendiente"}`}
              >
                {contenido}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
