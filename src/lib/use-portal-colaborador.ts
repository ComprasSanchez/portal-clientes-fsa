"use client";

import { useEffect, useState } from "react";
import type { PortalColaboradorResponse } from "@/types/portal-colaborador";

export type UsePortalColaboradorResult = {
  esColaborador: boolean;
  isLoading: boolean;
};

// Consulta si el socio logueado es colaborador activo. Ante cualquier error
// se asume que no lo es: la sección Colaboradores queda oculta.
export const usePortalColaborador = (): UsePortalColaboradorResult => {
  const [esColaborador, setEsColaborador] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/portal/me/colaborador", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PortalColaboradorResponse | null) => {
        setEsColaborador(data?.es_colaborador === true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setEsColaborador(false);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  return { esColaborador, isLoading };
};
