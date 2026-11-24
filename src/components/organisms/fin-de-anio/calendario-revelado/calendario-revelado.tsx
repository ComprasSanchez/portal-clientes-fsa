"use client";

import { useEffect, useState } from "react";
import PortalButton from "@/components/atoms/button/button";
import Nieve from "@/components/molecules/fin-de-anio/nieve/nieve";
import ReveladoFichas from "@/components/molecules/fin-de-anio/revelado-fichas/revelado-fichas";
import ReveladoPuertas from "@/components/molecules/fin-de-anio/revelado-puertas/revelado-puertas";
import { contenidoDelDia, fechaLegible, type CalendarioDia as Dia } from "@/lib/fin-de-anio";
import styles from "./calendario-revelado.module.scss";

const DURACION_CIERRE_MS = 300;

type CalendarioReveladoProps = {
  dia: Dia;
  /** Primera vez: puertas, fichas que caen y textos escalonados. Si ya la abrió, va directo. */
  animado: boolean;
  esHoy: boolean;
  onCerrar: () => void;
  onVerBases: () => void;
};

/** La sorpresa del día a pantalla completa (en la compu, tarjeta centrada). */
export default function CalendarioRevelado({ dia, animado, esHoy, onCerrar, onVerBases }: CalendarioReveladoProps) {
  const [cerrando, setCerrando] = useState(false);
  const contenido = contenidoDelDia(dia.dia);
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
          <h2 className={styles.titulo}>{contenido.titulo}</h2>
          <p className={styles.detalle}>{contenido.detalle}</p>
          <div className={styles.recuadro}>
            <span>{contenido.recuadro.etiqueta}</span>
            <b>{contenido.recuadro.valor}</b>
          </div>

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
