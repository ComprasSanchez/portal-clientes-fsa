import { Gift } from "lucide-react";
import PortalButton from "@/components/atoms/button/button";
import styles from "./regalos-pendientes.module.scss";

type RegalosPendientesProps = {
  cantidad: number;
  onRetirar: () => void;
};

/** Aviso arriba del calendario cuando hay regalos ganados sin retirar. */
export default function RegalosPendientes({ cantidad, onRetirar }: RegalosPendientesProps) {
  return (
    <section className={styles.aviso} aria-label="Regalos para retirar">
      <span className={styles.icono} aria-hidden>
        <Gift size={22} />
      </span>
      <div className={styles.texto}>
        <strong>
          {cantidad === 1 ? "Tenés 1 regalo para retirar" : `Tenés ${cantidad} regalos para retirar`}
        </strong>
        <span>En cualquier sucursal, pedile al personal su QR, escanealo y te lo entregan.</span>
      </div>
      <div className={styles.accion}>
        <PortalButton tone="socios" onClick={onRetirar}>
          Escanear QR
        </PortalButton>
      </div>
    </section>
  );
}
