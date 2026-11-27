"use client";

import { MapPin, RefreshCw } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import QrCodigo from "@/components/molecules/qr-codigo/qr-codigo";
import { Skeleton } from "@/components/ui/skeleton";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./qr-entrega-card.module.scss";

type QrEntregaCardProps = {
  sucursal: string;
  /** null mientras carga. */
  codigo: string | null;
  /** Milisegundos hasta que cambia el QR, para la barra de tiempo. */
  restanteMs: number;
  error?: string | null;
  onCambiarSucursal: () => void;
  tone?: UiTone;
};

/** QR grande que escanea el socio, con la sucursal y cuánto falta para que cambie. */
export default function QrEntregaCard({
  sucursal,
  codigo,
  restanteMs,
  error,
  onCambiarSucursal,
  tone = "socios",
}: QrEntregaCardProps) {

  return (
    <section className={`${styles.card} ${toneClass(tone)}`} aria-label="QR para entregar regalos">
      <header className={styles.cabecera}>
        <span className={styles.sucursal}>
          <MapPin size={18} aria-hidden />
          {sucursal}
        </span>
        <button type="button" className={styles.cambiar} onClick={onCambiarSucursal}>
          Cambiar
        </button>
      </header>

      <div className={styles.cuerpo}>
        {error ? (
          <Alert color="error">{error}</Alert>
        ) : codigo ? (
          <>
            <div className={styles.marco}>
              <QrCodigo texto={codigo} etiqueta="QR para entregar regalos" />
            </div>
            {/* La barra se reinicia con cada QR nuevo. */}
            <div className={styles.tiempo} aria-hidden>
              <span key={codigo} className={styles.barra} style={{ animationDuration: `${restanteMs}ms` }} />
            </div>
            <p className={styles.ayuda}>
              <RefreshCw size={14} aria-hidden /> Se renueva solo cada 30 segundos.
            </p>
          </>
        ) : (
          <Skeleton className={styles.skeleton} />
        )}
      </div>
    </section>
  );
}
