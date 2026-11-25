"use client";

import { Pause, Play } from "lucide-react";
import styles from "./tour-simulador.module.scss";

type TourSimuladorProps = {
  /** Cantidad de paradas en el mapa. */
  paradas: number;
  /** Avance simulado (null = se usa el real). */
  avance: number | null;
  reproduciendo: boolean;
  onCambiar: (avance: number) => void;
  onReproducir: () => void;
  onPausar: () => void;
  onVolverAlReal: () => void;
};

/** Solo pruebas: mover a Papá Noel a mano o ver el viaje completo. */
export default function TourSimulador({
  paradas,
  avance,
  reproduciendo,
  onCambiar,
  onReproducir,
  onPausar,
  onVolverAlReal,
}: TourSimuladorProps) {
  const max = Math.max(0, paradas - 1);
  return (
    <div className={styles.simulador}>
      <div className={styles.fila}>
        <strong>Modo prueba</strong>
        <button
          type="button"
          className={styles.boton}
          onClick={reproduciendo ? onPausar : onReproducir}
          disabled={paradas < 2}
        >
          {reproduciendo ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
          {reproduciendo ? "Pausar" : "Ver el viaje"}
        </button>
        {avance !== null && (
          <button type="button" className={styles.link} onClick={onVolverAlReal}>
            Volver a la hora real
          </button>
        )}
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={0.05}
        value={avance ?? 0}
        onChange={(e) => onCambiar(Number(e.target.value))}
        aria-label="Mover a Papá Noel por el recorrido"
        className={styles.barra}
      />
    </div>
  );
}
