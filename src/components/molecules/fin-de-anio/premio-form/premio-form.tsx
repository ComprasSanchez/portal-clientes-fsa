"use client";

import { useState, type FormEvent } from "react";
import TextField from "@/components/atoms/text-field/text-field";
import DiaFormPie from "@/components/molecules/fin-de-anio/dia-form-pie/dia-form-pie";
import VistaPreviaSocio from "@/components/molecules/fin-de-anio/vista-previa-socio/vista-previa-socio";
import { enteroEntre, type ContenidoAdmin, type ContenidoDe } from "@/lib/calendario-admin";
import { useEnvioFormulario } from "@/lib/use-envio-formulario";
import styles from "./premio-form.module.scss";

type PremioFormProps = {
  inicial: ContenidoDe<"PREMIO"> | null;
  onGuardar: (contenido: ContenidoAdmin) => Promise<void>;
  /** Error del guardado (ya en lenguaje para el colaborador). */
  error?: string | null;
};

/** Regalo hasta agotar: cuántos hay y qué es. */
export default function PremioForm({ inicial, onGuardar, error }: PremioFormProps) {
  const [cantidad, setCantidad] = useState(inicial ? String(inicial.stockTotal) : "");
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
    void enviar({ tipo: "PREMIO", stockTotal: numero, queSeGana: queSeGana.trim() || null });
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <TextField
        id="premio-form-cantidad"
        label="Cantidad de regalos"
        inputMode="numeric"
        maxLength={6}
        autoComplete="off"
        placeholder="Ej.: 20"
        hint="Los gana quien abre la casilla, hasta agotar los del día."
        value={cantidad}
        onChange={(e) => {
          setCantidad(e.target.value.replace(/\D/g, ""));
          setErrorCantidad(null);
        }}
        error={errorCantidad}
      />
      <TextField
        id="premio-form-que"
        label="Qué se gana (opcional)"
        maxLength={80}
        autoComplete="off"
        placeholder="Ej.: un kit Dermaglós"
        hint="Si lo dejás vacío es un regalo sorpresa."
        value={queSeGana}
        onChange={(e) => setQueSeGana(e.target.value)}
      />
      <VistaPreviaSocio
        titulo={queSeGana.trim() ? `¡Ganaste ${queSeGana.trim()}!` : "¡Ganaste un regalo sorpresa!"}
        detalle="Retiralo en cualquier sucursal escaneando el QR de la sucursal desde acá."
        extra={`Quedan ${numero ?? "X"} de ${numero ?? "X"}`}
      />
      <DiaFormPie error={error} guardando={guardando} />
    </form>
  );
}
