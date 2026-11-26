"use client";

import { useState } from "react";

/** Estado "guardando" de un formulario que llama a `onGuardar`. */
export function useEnvioFormulario<T>(onGuardar: (valor: T) => Promise<void>) {
  const [guardando, setGuardando] = useState(false);
  const enviar = async (valor: T) => {
    setGuardando(true);
    try {
      await onGuardar(valor);
    } finally {
      setGuardando(false);
    }
  };
  return { guardando, enviar };
}
