"use client";

import { useState, type CSSProperties } from "react";
import styles from "./nieve.module.scss";

type NieveProps = {
  copos?: number;
};

/** Copos cayendo de fondo (decorativo). */
export default function Nieve({ copos = 26 }: NieveProps) {
  // Se sortea una sola vez para que no salten en cada render.
  const [lista] = useState(() =>
    Array.from({ length: copos }, () => ({
      left: `${Math.random() * 100}%`,
      animationDuration: `${4 + Math.random() * 5}s`,
      animationDelay: `${-Math.random() * 6}s`,
      scale: 0.5 + Math.random(),
    })),
  );

  return (
    <div className={styles.nieve} aria-hidden>
      {lista.map(({ scale, ...estilo }, i) => (
        <i key={i} className={styles.copo} style={{ ...estilo, "--escala": scale } as CSSProperties} />
      ))}
    </div>
  );
}
