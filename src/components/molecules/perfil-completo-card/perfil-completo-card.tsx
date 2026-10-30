import { ChevronRight, UserRoundCheck, X } from "lucide-react";
import Card from "@/components/atoms/card/card";
import {
  PERFIL_ITEMS_TOTAL,
  PERFIL_PENDIENTE_TEXTO,
  type PerfilPendiente,
} from "@/lib/perfil-completo";
import { type UiTone } from "@/types/ui-tone";
import styles from "./perfil-completo-card.module.scss";

type PerfilCompletoCardProps = {
  pendientes: PerfilPendiente[];
  /** Al tocar un dato pendiente (lleva a Mi perfil). */
  onSelect: (pendiente: PerfilPendiente) => void;
  /** "Ahora no": la oculta por un día. */
  onDismiss: () => void;
  tone?: UiTone;
  className?: string;
};

/** "Completá tus datos": avance y lista de lo que falta, cada uno con su acción. */
export default function PerfilCompletoCard({
  pendientes,
  onSelect,
  onDismiss,
  tone = "socios",
  className = "",
}: PerfilCompletoCardProps) {
  const completos = PERFIL_ITEMS_TOTAL - pendientes.length;

  return (
    <Card tone={tone} className={`${styles.card} ${className}`}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden>
          <UserRoundCheck size={24} />
        </span>
        <div className={styles.copy}>
          <p className={styles.title}>Completá tus datos</p>
          <p className={styles.text}>
            Así recibís tus beneficios y los avisos de tus pedidos.
          </p>
        </div>
        <button type="button" onClick={onDismiss} aria-label="Ahora no" className={styles.close}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.progressRow}>
        <div
          className={styles.bar}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={PERFIL_ITEMS_TOTAL}
          aria-valuenow={completos}
          aria-label="Datos completos"
        >
          <span
            className={styles.fill}
            style={{ width: `${(completos / PERFIL_ITEMS_TOTAL) * 100}%` }}
          />
        </div>
        <span className={styles.count}>
          {completos} de {PERFIL_ITEMS_TOTAL}
        </span>
      </div>

      <ul className={styles.list}>
        {pendientes.map((p) => (
          <li key={p}>
            <button type="button" className={styles.item} onClick={() => onSelect(p)}>
              <span className={styles.itemLabel}>{PERFIL_PENDIENTE_TEXTO[p].label}</span>
              <span className={styles.itemAction}>
                {PERFIL_PENDIENTE_TEXTO[p].accion}
                <ChevronRight size={16} aria-hidden />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
