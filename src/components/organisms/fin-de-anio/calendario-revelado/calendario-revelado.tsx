"use client";

import { useEffect, useState, type ReactNode } from "react";
import PortalButton from "@/components/atoms/button/button";
import Nieve from "@/components/molecules/fin-de-anio/nieve/nieve";
import ReveladoFichas from "@/components/molecules/fin-de-anio/revelado-fichas/revelado-fichas";
import ReveladoPuertas from "@/components/molecules/fin-de-anio/revelado-puertas/revelado-puertas";
import { fechaLegible, type CalendarioDia as Dia, type CalendarioTextos } from "@/lib/fin-de-anio";
import styles from "./calendario-revelado.module.scss";

const DURACION_CIERRE_MS = 300;

type CalendarioReveladoProps = {
  dia: Dia;
  textos: CalendarioTextos;
  /** Primera vez: puertas, fichas que caen y textos escalonados. Si ya la abrió, va directo. */
  animado: boolean;
  esHoy: boolean;
  /** Algo más debajo del texto (ej. las preguntas de la trivia). */
  extra?: ReactNode;
  onCerrar: () => void;
  onVerBases: () => void;
};

/** La sorpresa del día a pantalla completa (en la compu, tarjeta centrada). */
export default function CalendarioRevelado({ dia, textos, animado, esHoy, extra, onCerrar, onVerBases }: CalendarioReveladoProps) {
  const [cerrando, setCerrando] = useState(false);
  const sorpresa = esHoy ? "Tu sorpresa de hoy" : `Tu sorpresa del ${fechaLegible(dia.dia)}`;

  useEffect(() => {
    if (!cerrando) return;
    const id = window.setTimeout(onCerrar, DURACION_CIERRE_MS);
    return () => window.clearTimeout(id);
  }, [cerrando, onCerrar]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCerrando(true);
    };
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      className={`${styles.overlay} ${cerrando ? styles.cerrando : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Sorpresa del ${fechaLegible(dia.dia)}`}
    >
      <div className={`${styles.tarjeta} ${styles[dia.color]} ${animado ? styles.animado : ""}`}>
        <Nieve />

        <div className={styles.contenido}>
          <ReveladoFichas dia={dia.dia} animado={animado} />
          <p className={styles.kicker}>{animado ? sorpresa : `Ya abriste esta casilla · ${sorpresa}`}</p>
          <h2 className={styles.titulo}>{textos.titulo}</h2>
          {textos.detalle && <p className={styles.detalle}>{textos.detalle}</p>}
          {textos.recuadro && (
            <div className={styles.recuadro}>
              <span>{textos.recuadro.etiqueta}</span>
              <b>{textos.recuadro.valor}</b>
            </div>
          )}
          {extra && <div className={styles.extra}>{extra}</div>}

          <div className={styles.acciones}>
            <PortalButton variant="claro" onClick={() => setCerrando(true)}>
              ‹ Regresar al calendario
            </PortalButton>
            <button type="button" className={styles.bases} onClick={onVerBases}>
              Bases y condiciones
            </button>
          </div>
        </div>

        {animado && <ReveladoPuertas color={dia.color} />}
      </div>
    </div>
  );
}
