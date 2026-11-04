"use client";

import { useMemo } from "react";
import QRCode from "qrcode";
import styles from "./SociosColaboradorFiestaView.module.scss";

type Props = { token: string };

/**
 * QR de la credencial de la fiesta (el mismo que va impreso).
 * Sirve si la persona todavía no la retiró o la perdió: la muestra desde el celu
 * y el referente la escanea igual. Se dibuja en SVG, sin pedir nada a la red.
 */
export default function FiestaCredencialQr({ token }: Props) {
  const qr = useMemo(() => {
    const { modules } = QRCode.create(token, { errorCorrectionLevel: "M" });
    const n = modules.size;
    let d = "";
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return { n, d };
  }, [token]);

  const borde = 2;
  const lado = qr.n + borde * 2;

  return (
    <figure className={styles.qrCredencial}>
      <svg
        viewBox={`${-borde} ${-borde} ${lado} ${lado}`}
        role="img"
        aria-label="QR de tu credencial"
        shapeRendering="crispEdges"
      >
        <rect x={-borde} y={-borde} width={lado} height={lado} fill="#fff" />
        <path d={qr.d} fill="#17343d" />
      </svg>
      <figcaption>
        Si todavía no tenés la credencial impresa, mostrale este QR al referente.
      </figcaption>
    </figure>
  );
}
