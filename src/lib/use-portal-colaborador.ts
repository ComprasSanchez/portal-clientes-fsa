"use client";

import { useEffect, useState } from "react";
import { useIdentidad } from "@/lib/portal-identidad-context";
import type { PortalColaboradorResponse } from "@/types/portal-colaborador";

export type UsePortalColaboradorResult = {
  esColaborador: boolean;
  isLoading: boolean;
};

// Consulta si el socio logueado es colaborador activo. Ante cualquier error
// se asume que no lo es: la sección Colaboradores queda oculta.
// Espera a que la cuenta esté vinculada: si se vincula al entrar, consulta después.
export const usePortalColaborador = (): UsePortalColaboradorResult => {
  const { vinculada, cargando } = useIdentidad();
  const [respuesta, setRespuesta] = useState<boolean | null>(null);

  useEffect(() => {
    if (!vinculada) return;
    const controller = new AbortController();

    void fetch("/api/portal/me/colaborador", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PortalColaboradorResponse | null) => {
        setRespuesta(data?.es_colaborador === true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setRespuesta(false);
      });

    return () => {
      controller.abort();
    };
  }, [vinculada]);

  return {
    esColaborador: vinculada && respuesta === true,
    isLoading: cargando || (vinculada && respuesta === null),
  };
};
