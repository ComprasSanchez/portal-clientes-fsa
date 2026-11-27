"use client";

import { useMemo } from "react";
import QRCode from "qrcode";
import styles from "./qr-codigo.module.scss";

type QrCodigoProps = {
  texto: string;
  /** Para lectores de pantalla (ej. "QR para entregar regalos"). */
  etiqueta: string;
  className?: string;
};

/** QR dibujado en SVG, sin pedir nada a la red. */
export default function QrCodigo({ texto, etiqueta, className = "" }: QrCodigoProps) {
  const qr = useMemo(() => {
    const { modules } = QRCode.create(texto, { errorCorrectionLevel: "M" });
    const n = modules.size;
    let d = "";
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return { n, d };
  }, [texto]);

  const borde = 2;
  const lado = qr.n + borde * 2;
  return (
    <svg
      className={`${styles.qr} ${className}`}
      viewBox={`${-borde} ${-borde} ${lado} ${lado}`}
      role="img"
      aria-label={etiqueta}
      shapeRendering="crispEdges"
    >
      <rect x={-borde} y={-borde} width={lado} height={lado} fill="#fff" />
      <path d={qr.d} fill="#17343d" />
    </svg>
  );
}
