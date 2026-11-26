"use client";

import { useState } from "react";
import PortalButton from "@/components/atoms/button/button";
import type { CalendarioPregunta } from "@/types/portal-calendario";
import styles from "./trivia-preguntas.module.scss";

type TriviaPreguntasProps = {
  preguntas: CalendarioPregunta[];
  /** Devuelve el mensaje de error para mostrar, o null si salió bien. */
  onResponder: (respuestas: Record<string, string>) => Promise<string | null>;
};

/** Preguntas de la trivia con sus opciones (va dentro de la tarjeta del día). */
export default function TriviaPreguntas({ preguntas, onResponder }: TriviaPreguntasProps) {
  const [elegidas, setElegidas] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completas = preguntas.every((p) => elegidas[p.id]);

  const responder = async () => {
    setEnviando(true);
    setError(await onResponder(elegidas));
    setEnviando(false);
  };

  return (
    <div className={styles.trivia}>
      {preguntas.map((p) => (
        <fieldset key={p.id} className={styles.pregunta}>
          <legend className={styles.texto}>{p.texto}</legend>
          <div className={styles.opciones}>
            {p.opciones.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`${styles.opcion} ${elegidas[p.id] === o.id ? styles.elegida : ""}`}
                aria-pressed={elegidas[p.id] === o.id}
                onClick={() => setElegidas((prev) => ({ ...prev, [p.id]: o.id }))}
              >
                {o.texto}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {error && <p className={styles.error}>{error}</p>}
      <PortalButton variant="claro" onClick={responder} disabled={!completas} loading={enviando}>
        Responder
      </PortalButton>
    </div>
  );
}
