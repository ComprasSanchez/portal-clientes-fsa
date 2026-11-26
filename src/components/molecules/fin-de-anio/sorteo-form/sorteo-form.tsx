"use client";

import { useState, type FormEvent } from "react";
import TextField from "@/components/atoms/text-field/text-field";
import DiaFormPie from "@/components/molecules/fin-de-anio/dia-form-pie/dia-form-pie";
import VistaPreviaSocio from "@/components/molecules/fin-de-anio/vista-previa-socio/vista-previa-socio";
import { enteroEntre, type ContenidoAdmin, type ContenidoDe } from "@/lib/calendario-admin";
import { useEnvioFormulario } from "@/lib/use-envio-formulario";
import styles from "./sorteo-form.module.scss";

type SorteoFormProps = {
  inicial: ContenidoDe<"SORTEO"> | null;
  onGuardar: (contenido: ContenidoAdmin) => Promise<void>;
  /** Error del guardado (ya en lenguaje para el colaborador). */
  error?: string | null;
};

/** Sorteo del día: cuántos ganan y qué se sortea. */
export default function SorteoForm({ inicial, onGuardar, error }: SorteoFormProps) {
  const [cantidad, setCantidad] = useState(inicial ? String(inicial.cantidadRegalos) : "");
  const [queSeGana, setQueSeGana] = useState(inicial?.queSeGana ?? "");
  const [errorCantidad, setErrorCantidad] = useState<string | null>(null);
  const { guardando, enviar } = useEnvioFormulario(onGuardar);
  const numero = enteroEntre(cantidad, 1, 100000);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (numero === null) {
      setErrorCantidad("Un número mayor a 0.");
      return;
    }
    void enviar({ tipo: "SORTEO", cantidadRegalos: numero, queSeGana: queSeGana.trim() || null });
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <TextField
        id="sorteo-form-cantidad"
        label="Cantidad de ganadores"
        inputMode="numeric"
        maxLength={6}
        autoComplete="off"
        placeholder="Ej.: 20"
        hint="Se sortea al día siguiente entre quienes abrieron la casilla."
        value={cantidad}
        onChange={(e) => {
          setCantidad(e.target.value.replace(/\D/g, ""));
          setErrorCantidad(null);
        }}
        error={errorCantidad}
      />
      <TextField
        id="sorteo-form-que"
        label="Qué se gana (opcional)"
        maxLength={80}
        autoComplete="off"
        placeholder="Ej.: un kit Dermaglós"
        hint="Si lo dejás vacío es un regalo sorpresa."
        value={queSeGana}
        onChange={(e) => setQueSeGana(e.target.value)}
      />
      <VistaPreviaSocio
        titulo="¡Ya estás participando!"
        detalle={
          queSeGana.trim()
            ? `Se sortea ${queSeGana.trim()}. El resultado sale mañana: volvé a ver si ganaste.`
            : "El resultado sale mañana. Volvé a ver si ganaste."
        }
        extra={`${queSeGana.trim() ? "Ganadores" : "Regalos sorpresa en juego"}: ${numero ?? "X"}`}
      />
      <DiaFormPie error={error} guardando={guardando} />
    </form>
  );
}
