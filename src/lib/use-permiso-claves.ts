"use client";

import { useEffect, useState } from "react";
import { consultarPermisoClaves } from "@/lib/auth-nuevo";

// Si el colaborador puede darle una contraseña nueva a un socio. Ante un error, no.
export const usePermisoClaves = (esColaborador: boolean, isColaboradorLoading: boolean) => {
  const [respuesta, setRespuesta] = useState<boolean | null>(null);
  const consultar = esColaborador && !isColaboradorLoading;

  useEffect(() => {
    if (!consultar) return;
    let cancelado = false;
    consultarPermisoClaves()
      .then((r) => !cancelado && setRespuesta(r.habilitado === true))
      .catch(() => !cancelado && setRespuesta(false));
    return () => {
      cancelado = true;
    };
  }, [consultar]);

  return {
    puedeCambiarClaves: consultar && respuesta === true,
    isLoading: isColaboradorLoading || (consultar && respuesta === null),
  };
};
