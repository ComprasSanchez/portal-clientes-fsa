"use client";

/* eslint-disable @next/next/no-img-element -- dibujo chico y estático */
import { useLayoutEffect, useRef } from "react";
import TourPildora from "@/components/molecules/fin-de-anio/tour-pildora/tour-pildora";
import {
  horarioParada,
  nombreParada,
  PAPA_NOEL_IMAGEN,
  PILDORA_PARADA,
  type ParadaConSucursal,
} from "@/lib/tour-papa-noel";
import styles from "./tour-recorrido.module.scss";

type TourRecorridoProps = {
  paradas: ParadaConSucursal[];
  /** Por dónde va Papá Noel en esta lista (1.5 = mitad entre la 2ª y la 3ª); null = no se dibuja. */
  avance: number | null;
};

const VARIANTE = { AHORA: "llena", PROXIMA: "llena", SIGUE: "contorno", YA_PASO: "apagada" } as const;

/** Todas las paradas en orden, unidas por una línea, con Papá Noel viajando por ella. */
export default function TourRecorrido({ paradas, avance }: TourRecorridoProps) {
  const lista = useRef<HTMLOListElement | null>(null);
  const papaNoel = useRef<HTMLImageElement | null>(null);

  // Ubica a Papá Noel sobre la línea (las paradas tienen alturas distintas: se miden).
  useLayoutEffect(() => {
    const ol = lista.current;
    const img = papaNoel.current;
    if (!ol || !img || avance === null) return;
    const ubicar = () => {
      const arriba = ol.getBoundingClientRect().top;
      const puntos = [...ol.querySelectorAll<HTMLElement>("[data-punto]")].map((p) => {
        const r = p.getBoundingClientRect();
        return r.top - arriba + r.height / 2;
      });
      if (!puntos.length) return;
      const i = Math.max(0, Math.min(puntos.length - 1, Math.floor(avance)));
      const j = Math.min(puntos.length - 1, i + 1);
      const y = puntos[i] + (puntos[j] - puntos[i]) * Math.max(0, Math.min(1, avance - i));
      img.style.transform = `translateY(${y}px) translateY(-50%)`;
      img.style.opacity = "1";
    };
    // La primera vez sale desde la primera parada (así se lo ve viajar).
    const frame = requestAnimationFrame(ubicar);
    const obs = new ResizeObserver(ubicar);
    obs.observe(ol);
    return () => {
      cancelAnimationFrame(frame);
      obs.disconnect();
    };
  }, [avance, paradas]);

  return (
    <ol ref={lista} className={styles.recorrido}>
      {avance !== null && <img ref={papaNoel} src={PAPA_NOEL_IMAGEN} alt="" className={styles.papaNoel} aria-hidden />}
      {paradas.map((p) => (
        <li key={p.orden} className={`${styles.parada} ${p.estado === "YA_PASO" ? styles.pasada : ""}`}>
          <span className={styles.marca} aria-hidden>
            <span className={styles.punto} data-punto />
          </span>
          <div className={styles.datos}>
            <div className={styles.cabecera}>
              <h4 className={styles.nombre}>{nombreParada(p)}</h4>
              <TourPildora variante={VARIANTE[p.estado]}>{PILDORA_PARADA[p.estado]}</TourPildora>
            </div>
            <p>{horarioParada(p)}</p>
            {p.datos?.direccion && <p>{p.datos.direccion}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
