"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import TextField from "@/components/atoms/text-field/text-field";
import DiaFormPie from "@/components/molecules/fin-de-anio/dia-form-pie/dia-form-pie";
import VistaPreviaSocio from "@/components/molecules/fin-de-anio/vista-previa-socio/vista-previa-socio";
import { enteroEntre, type ContenidoAdmin, type ContenidoDe } from "@/lib/calendario-admin";
import { useEnvioFormulario } from "@/lib/use-envio-formulario";
import styles from "./trivia-form.module.scss";

type TriviaFormProps = {
  inicial: ContenidoDe<"TRIVIA"> | null;
  onGuardar: (contenido: ContenidoAdmin) => Promise<void>;
  /** Error del guardado (ya en lenguaje para el colaborador). */
  error?: string | null;
};

type PreguntaForm = { texto: string; opciones: string[]; correcta: number };

const MAX_PREGUNTAS = 2;
const MAX_OPCIONES = 4;
const LETRAS = ["a", "b", "c", "d"];
const vacia = (): PreguntaForm => ({ texto: "", opciones: ["", ""], correcta: 0 });

/** Trivia: puntos y 1 o 2 preguntas con 2 a 4 opciones y la correcta marcada. */
export default function TriviaForm({ inicial, onGuardar, error }: TriviaFormProps) {
  const [puntos, setPuntos] = useState(inicial ? String(inicial.puntos) : "");
  const [preguntas, setPreguntas] = useState<PreguntaForm[]>(
    inicial?.preguntas.map((p) => ({
      texto: p.texto,
      opciones: p.opciones.map((o) => o.texto),
      correcta: Math.max(
        0,
        p.opciones.findIndex((o) => o.id === p.correctaId),
      ),
    })) ?? [vacia()],
  );
  const [aviso, setAviso] = useState<string | null>(null);
  const { guardando, enviar } = useEnvioFormulario(onGuardar);
  const numero = enteroEntre(puntos, 1, 1000000);

  const cambiar = (i: number, cambio: Partial<PreguntaForm>) => {
    setAviso(null);
    setPreguntas((prev) => prev.map((p, j) => (j === i ? { ...p, ...cambio } : p)));
  };
  const cambiarOpcion = (i: number, k: number, texto: string) =>
    cambiar(i, { opciones: preguntas[i].opciones.map((o, j) => (j === k ? texto : o)) });
  const quitarOpcion = (i: number, k: number) => {
    const p = preguntas[i];
    const correcta = p.correcta === k ? 0 : p.correcta > k ? p.correcta - 1 : p.correcta;
    cambiar(i, { opciones: p.opciones.filter((_, j) => j !== k), correcta });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (numero === null) return setAviso("Poné cuántos puntos suma si acierta.");
    if (preguntas.some((p) => !p.texto.trim() || p.opciones.some((o) => !o.trim()))) {
      return setAviso("Completá todas las preguntas y sus opciones.");
    }
    void enviar({
      tipo: "TRIVIA",
      puntos: numero,
      preguntas: preguntas.map((p, i) => ({
        id: `p${i + 1}`,
        texto: p.texto.trim(),
        opciones: p.opciones.map((o, k) => ({ id: LETRAS[k], texto: o.trim() })),
        correctaId: LETRAS[p.correcta],
      })),
    });
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <TextField
        id="trivia-puntos"
        label="Puntos si acierta todo"
        inputMode="numeric"
        maxLength={7}
        autoComplete="off"
        placeholder="Ej.: 500"
        value={puntos}
        onChange={(e) => {
          setPuntos(e.target.value.replace(/\D/g, ""));
          setAviso(null);
        }}
      />

      {preguntas.map((p, i) => (
        <fieldset key={i} className={styles.pregunta}>
          <legend className={styles.leyenda}>Pregunta {i + 1}</legend>
          <TextField
            id={`trivia-p${i}`}
            label="Pregunta"
            maxLength={200}
            autoComplete="off"
            placeholder="Ej.: ¿En qué año abrió la primera farmacia?"
            value={p.texto}
            onChange={(e) => cambiar(i, { texto: e.target.value })}
          />
          <p className={styles.ayuda}>Marcá la respuesta correcta.</p>
          {p.opciones.map((o, k) => (
            <div key={k} className={styles.opcion}>
              <input
                type="radio"
                name={`trivia-correcta-${i}`}
                className={styles.radio}
                checked={p.correcta === k}
                onChange={() => cambiar(i, { correcta: k })}
                aria-label={`Opción ${k + 1} es la correcta`}
              />
              <input
                className={styles.opcionTexto}
                maxLength={80}
                placeholder={`Opción ${k + 1}`}
                value={o}
                onChange={(e) => cambiarOpcion(i, k, e.target.value)}
                aria-label={`Opción ${k + 1}`}
              />
              {p.opciones.length > 2 && (
                <button
                  type="button"
                  className={styles.icono}
                  onClick={() => quitarOpcion(i, k)}
                  aria-label={`Quitar opción ${k + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <div className={styles.acciones}>
            {p.opciones.length < MAX_OPCIONES && (
              <button
                type="button"
                className={styles.link}
                onClick={() => cambiar(i, { opciones: [...p.opciones, ""] })}
              >
                <Plus size={14} /> Agregar opción
              </button>
            )}
            {preguntas.length > 1 && (
              <button
                type="button"
                className={styles.link}
                onClick={() => setPreguntas((prev) => prev.filter((_, j) => j !== i))}
              >
                <Trash2 size={14} /> Quitar pregunta
              </button>
            )}
          </div>
        </fieldset>
      ))}

      {preguntas.length < MAX_PREGUNTAS && (
        <button type="button" className={styles.link} onClick={() => setPreguntas((prev) => [...prev, vacia()])}>
          <Plus size={14} /> Agregar otra pregunta
        </button>
      )}

      <VistaPreviaSocio
        titulo="Trivia del día"
        detalle={`Respondé bien y sumá ${numero ?? "X"} puntos.`}
        extra={preguntas[0]?.texto.trim() || null}
      />
      <DiaFormPie error={aviso ?? error} guardando={guardando} />
    </form>
  );
}
