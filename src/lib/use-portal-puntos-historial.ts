"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortalHistorialSaldoResponse } from "@/types/portal-puntos";

type UsePortalPuntosHistorialOptions = {
  enabled?: boolean;
  page?: number;
  limit?: number;
};

export type UsePortalPuntosHistorialResult = {
  historial: PortalHistorialSaldoResponse | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
};

const readErrorMessage = async (response: Response): Promise<string> => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;

    return data?.message || data?.error || "No se pudo cargar el historial de saldo";
  }

  return (
    (await response.text().catch(() => "")) ||
    "No se pudo cargar el historial de saldo"
  );
};

export const usePortalPuntosHistorial = ({
  enabled = true,
  limit = 20,
}: UsePortalPuntosHistorialOptions = {}): UsePortalPuntosHistorialResult => {
  const [historial, setHistorial] = useState<PortalHistorialSaldoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadHistorial = useCallback(
    async (currentPage: number, signal?: AbortSignal) => {
      if (!enabled) {
        setHistorial(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
        });

        const response = await fetch(
          `/api/portal/me/puntos/historial-saldo?${params.toString()}`,
          { cache: "no-store", signal },
        );

        if (response.status === 401) {
          setHistorial(null);
          return;
        }

        if (response.status === 403) {
          setHistorial(null);
          setError(
            "Tu cuenta no tiene un cliente vinculado. Contactá a soporte para completar la vinculación.",
          );
          return;
        }

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as PortalHistorialSaldoResponse;
        setHistorial(data);
      } catch (requestError) {
        if (signal?.aborted) return;

        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el historial de saldo",
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [enabled, limit],
  );

  useEffect(() => {
    if (!enabled) {
      setHistorial(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    void loadHistorial(page, controller.signal);

    return () => {
      controller.abort();
    };
  }, [enabled, page, loadHistorial]);

  return {
    historial,
    isLoading,
    error,
    page,
    setPage,
    refresh: async () => {
      await loadHistorial(page);
    },
  };
};
