"use client";

import { useMemo } from "react";
import QRCode from "qrcode";
import { CalendarDays, Clock, ExternalLink, Gift, MapPin, PartyPopper, Ticket } from "lucide-react";
import { DOSIS, DOSIS_SPONSORS, horaCorta } from "@/lib/dosis";
import { usePortalInvitacion } from "@/lib/use-portal-invitacion";
import styles from "./SociosDosisConexionView.module.scss";

/** Con la vista abierta se refresca, así el ingreso y el regalo aparecen solos. */
const REFRESCO_MS = 20_000;

function QrIngreso({ token }: { token: string }) {
  const qr = useMemo(() => {
    const { modules } = QRCode.create(token, { errorCorrectionLevel: "M" });
    let d = "";
    for (let y = 0; y < modules.size; y++) {
      for (let x = 0; x < modules.size; x++) {
        if (modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return { n: modules.size, d };
  }, [token]);
  const borde = 2;
  const lado = qr.n + borde * 2;
  return (
    <svg
      className={styles.qr}
      viewBox={`${-borde} ${-borde} ${lado} ${lado}`}
      role="img"
      aria-label="QR de ingreso a Dosis de Conexión"
      shapeRendering="crispEdges"
    >
      <rect x={-borde} y={-borde} width={lado} height={lado} fill="#fff" />
      <path d={qr.d} fill="#0c4f5f" />
    </svg>
  );
}

export function SociosDosisConexionView() {
  const { invitacion, isLoading } = usePortalInvitacion({ refrescoMs: REFRESCO_MS });
  const inv = invitacion?.invitado ?? null;

  if (isLoading && !invitacion) {
    return (
      <section className={styles.view} aria-busy="true">
        <div className={`${styles.hero} ${styles.skeleton}`} />
      </section>
    );
  }

  if (!inv) {
    return (
      <section className={styles.view}>
        <div className={styles.card}>
          <p className={styles.texto}>Esta sección es solo para las personas invitadas al evento.</p>
        </div>
      </section>
    );
  }

  const nombre = inv.nombre?.split(" ")[0];

  return (
    <section className={styles.view}>
      {/* Invitación */}
      <article className={styles.hero}>
        <img className={styles.brillos} src="/dosis/brillos.png" alt="" aria-hidden />
        <img className={styles.copas} src="/dosis/copas-amarillo.png" alt="" aria-hidden />
        <p className={styles.eyebrow}>{nombre ? `${nombre}, estás invitado/a` : "Estás invitado/a"}</p>
        <img className={styles.titulo} src="/dosis/titulo.png" alt={`${DOSIS.nombre}: ${DOSIS.bajada}`} />
        <ul className={styles.datos}>
          <li>
            <CalendarDays aria-hidden />
            <span>{DOSIS.fecha}</span>
          </li>
          <li>
            <Clock aria-hidden />
            <span>{DOSIS.hora}</span>
          </li>
          <li>
            <MapPin aria-hidden />
            <span>{DOSIS.lugar}</span>
          </li>
        </ul>
      </article>

      <div className={styles.grilla}>
        {/* Entrada */}
        <article className={styles.card}>
          <h2 className={styles.cardTitulo}>
            <Ticket aria-hidden /> Tu entrada
          </h2>
          {inv.ingreso_at && (
            <p className={styles.adentro}>
              <PartyPopper aria-hidden /> ¡Ya estás adentro! Ingresaste a las {horaCorta(inv.ingreso_at)}
            </p>
          )}
          {inv.qr_visible && inv.credencial_token ? (
            !inv.ingreso_at && (
              <div className={styles.qrBox}>
                <QrIngreso token={inv.credencial_token} />
                <p className={styles.texto}>Mostrá este QR en la entrada del evento.</p>
              </div>
            )
          ) : (
            <div className={styles.qrPendiente}>
              <Ticket aria-hidden />
              <p>Tu QR de ingreso va a aparecer acá el día del evento ✨</p>
            </div>
          )}
        </article>

        {/* Regalo: recién después de acreditarse, para no arruinar la sorpresa */}
        {inv.regalo && (
          <article className={`${styles.card} ${inv.regalo === "entregado" ? styles.regaloListo : styles.regalo}`}>
            <h2 className={styles.cardTitulo}>
              <Gift aria-hidden /> Tu regalo
            </h2>
            {inv.regalo === "entregado" ? (
              <>
                <p className={styles.regaloTitulo}>¡Ya te entregamos tu regalo!</p>
                <p className={styles.texto}>Que lo disfrutes 🥂</p>
              </>
            ) : (
              <>
                <p className={styles.regaloTitulo}>¡Tenés un regalo esperándote! 🎁</p>
                <p className={styles.texto}>Acercate al stand de regalos a retirarlo.</p>
              </>
            )}
          </article>
        )}

        {/* Cómo llegar */}
        <article className={`${styles.card} ${styles.mapaCard}`}>
          <h2 className={styles.cardTitulo}>
            <MapPin aria-hidden /> Cómo llegar
          </h2>
          <p className={styles.texto}>{DOSIS.lugar}</p>
          <iframe
            className={styles.mapa}
            title={`Mapa: ${DOSIS.lugar}`}
            src={DOSIS.mapsEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a className={styles.boton} href={DOSIS.mapsUrl} target="_blank" rel="noopener noreferrer">
            Abrir en Google Maps <ExternalLink aria-hidden />
          </a>
        </article>
      </div>

      {DOSIS_SPONSORS.length > 0 && (
        <article className={styles.card}>
          <h2 className={styles.cardTitulo}>Nos acompañan</h2>
          <div className={styles.sponsors}>
            {DOSIS_SPONSORS.map((s) => (
              <img key={s.nombre} src={s.logo} alt={s.nombre} />
            ))}
          </div>
        </article>
      )}
    </section>
  );
}
