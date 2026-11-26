"use client";

import { useState, type FormEvent } from "react";
import TextField from "@/components/atoms/text-field/text-field";
import DiaFormPie from "@/components/molecules/fin-de-anio/dia-form-pie/dia-form-pie";
import VistaPreviaSocio from "@/components/molecules/fin-de-anio/vista-previa-socio/vista-previa-socio";
import type { ContenidoAdmin, ContenidoDe } from "@/lib/calendario-admin";
import { useEnvioFormulario } from "@/lib/use-envio-formulario";
import styles from "./descuento-general-form.module.scss";

type DescuentoGeneralFormProps = {
  inicial: ContenidoDe<"DESCUENTO_GENERAL"> | null;
  onGuardar: (contenido: ContenidoAdmin) => Promise<void>;
  /** Error del guardado (ya en lenguaje para el colaborador). */
  error?: string | null;
};

/** Descuento general: título, detalle y condiciones. */
export default function DescuentoGeneralForm({ inicial, onGuardar, error }: DescuentoGeneralFormProps) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [detalle, setDetalle] = useState(inicial?.detalle ?? "");
  const [condiciones, setCondiciones] = useState(inicial?.condiciones ?? "");
  const [errorTitulo, setErrorTitulo] = useState<string | null>(null);
  const { guardando, enviar } = useEnvioFormulario(onGuardar);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setErrorTitulo("Escribí el título.");
      return;
    }
    void enviar({
      tipo: "DESCUENTO_GENERAL",
      titulo: titulo.trim(),
      detalle: detalle.trim() || null,
      condiciones: condiciones.trim() || null,
    });
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <TextField
        id="general-titulo"
        label="Título"
        maxLength={80}
        autoComplete="off"
        placeholder="Ej.: ¡Hasta 50% OFF en dermocosmética!"
        value={titulo}
        onChange={(e) => {
          setTitulo(e.target.value);
          setErrorTitulo(null);
        }}
        error={errorTitulo}
      />
      <TextField
        id="general-detalle"
        label="Detalle (opcional)"
        maxLength={200}
        autoComplete="off"
        placeholder="Ej.: En productos seleccionados"
        value={detalle}
        onChange={(e) => setDetalle(e.target.value)}
      />
      <TextField
        id="general-condiciones"
        label="Condiciones (opcional)"
        maxLength={200}
        autoComplete="off"
        placeholder="Ej.: No acumulable con otras promociones"
        value={condiciones}
        onChange={(e) => setCondiciones(e.target.value)}
      />
      <VistaPreviaSocio
        titulo={titulo.trim() || "Título del descuento"}
        detalle={detalle.trim() || condiciones.trim() || "Exclusivo para socios, solo en sucursal."}
      />
      <DiaFormPie error={error} guardando={guardando} />
    </form>
  );
}
