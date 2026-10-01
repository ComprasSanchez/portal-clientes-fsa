"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortalVentasColaboradorResponse } from "@/types/portal-colaborador";

type UsePortalVentasColaboradorOptions = {
  enabled?: boolean;
  /** YYYY-MM-DD. Sin rango, el servidor devuelve el mes en curso. */
  desde?: string;
  hasta?: string;
};

export type UsePortalVentasColaboradorResult = {
  ventas: PortalVentasColaboradorResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const GENERIC_ERROR =
  "No pudimos cargar tus ventas ahora mismo. Intentá nuevamente en unos minutos.";
const RANGE_ERROR =
  "Revisá las fechas: el rango puede ser de hasta 3 meses y \"desde\" no puede ser posterior a \"hasta\".";
const FORBIDDEN_ERROR = "Esta sección está disponible solo para colaboradores.";

export const usePortalVentasColaborador = ({
  enabled = true,
  desde,
  hasta,
}: UsePortalVentasColaboradorOptions = {}): UsePortalVentasColaboradorResult => {
  const [ventas, setVentas] = useState<PortalVentasColaboradorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadVentas = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) {
        setVentas(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (desde) params.set("desde", desde);
        if (hasta) params.set("hasta", hasta);
        const query = params.toString();

        const response = await fetch(
          `/api/portal/me/colaborador/ventas${query ? `?${query}` : ""}`,
          { cache: "no-store", signal },
        );

        if (response.status === 401) {
          setVentas(null);
          return;
        }

        if (response.status === 403) {
          setVentas(null);
          setError(FORBIDDEN_ERROR);
          return;
        }

        if (response.status === 400) {
          setVentas(null);
          setError(RANGE_ERROR);
          return;
        }

        if (!response.ok) {
          throw new Error(GENERIC_ERROR);
        }

        setVentas((await response.json()) as PortalVentasColaboradorResponse);
      } catch {
        if (signal?.aborted) return;
        setError(GENERIC_ERROR);
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [enabled, desde, hasta],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadVentas(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadVentas]);

  return {
    ventas,
    isLoading,
    error,
    refresh: async () => {
      await loadVentas();
    },
  };
};
