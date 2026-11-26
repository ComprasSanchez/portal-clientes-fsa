"use client";

import { useState, type FormEvent } from "react";
import TextField from "@/components/atoms/text-field/text-field";
import DiaFormPie from "@/components/molecules/fin-de-anio/dia-form-pie/dia-form-pie";
import VistaPreviaSocio from "@/components/molecules/fin-de-anio/vista-previa-socio/vista-previa-socio";
import { enteroEntre, type ContenidoAdmin, type ContenidoDe } from "@/lib/calendario-admin";
import { useEnvioFormulario } from "@/lib/use-envio-formulario";
import styles from "./descuento-marca-form.module.scss";

type DescuentoMarcaFormProps = {
  inicial: ContenidoDe<"DESCUENTO_MARCA"> | null;
  onGuardar: (contenido: ContenidoAdmin) => Promise<void>;
  /** Error del guardado (ya en lenguaje para el colaborador). */
  error?: string | null;
};

/** Descuento de una marca: marca, porcentaje y condiciones. */
export default function DescuentoMarcaForm({ inicial, onGuardar, error }: DescuentoMarcaFormProps) {
  const [marca, setMarca] = useState(inicial?.marca ?? "");
  const [porcentaje, setPorcentaje] = useState(inicial ? String(inicial.porcentaje) : "");
  const [condiciones, setCondiciones] = useState(inicial?.condiciones ?? "");
  const [errores, setErrores] = useState<{ marca?: string; porcentaje?: string }>({});
  const { guardando, enviar } = useEnvioFormulario(onGuardar);
  const numero = enteroEntre(porcentaje, 1, 100);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const nuevos = {
      ...(marca.trim() ? {} : { marca: "Escribí la marca." }),
      ...(numero !== null ? {} : { porcentaje: "Un número del 1 al 100." }),
    };
    setErrores(nuevos);
    if (Object.keys(nuevos).length || numero === null) return;
    void enviar({
      tipo: "DESCUENTO_MARCA",
      marca: marca.trim(),
      porcentaje: numero,
      condiciones: condiciones.trim() || null,
    });
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <TextField
        id="descuento-marca"
        label="Marca"
        maxLength={60}
        autoComplete="off"
        placeholder="Ej.: Dermaglós"
        value={marca}
        onChange={(e) => {
          setMarca(e.target.value);
          setErrores((prev) => ({ ...prev, marca: undefined }));
        }}
        error={errores.marca}
      />
      <TextField
        id="descuento-porcentaje"
        label="Descuento (%)"
        inputMode="numeric"
        maxLength={3}
        autoComplete="off"
        placeholder="Ej.: 20"
        value={porcentaje}
        onChange={(e) => {
          setPorcentaje(e.target.value.replace(/\D/g, ""));
          setErrores((prev) => ({ ...prev, porcentaje: undefined }));
        }}
        error={errores.porcentaje}
      />
      <TextField
        id="descuento-condiciones"
        label="Condiciones (opcional)"
        maxLength={200}
        autoComplete="off"
        placeholder="Ej.: En toda la línea facial"
        hint="Si lo dejás vacío dice: Exclusivo para socios, solo en sucursal."
        value={condiciones}
        onChange={(e) => setCondiciones(e.target.value)}
      />
      <VistaPreviaSocio
        titulo={`¡${numero ?? "X"}% OFF en ${marca.trim() || "la marca"}!`}
        detalle={condiciones.trim() || "Exclusivo para socios, solo en sucursal."}
      />
      <DiaFormPie error={error} guardando={guardando} />
    </form>
  );
}
