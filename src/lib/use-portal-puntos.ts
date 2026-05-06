"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getPortalPuntosSummary } from "@/lib/portal-puntos";
import type { PortalPuntosResponse } from "@/types/portal-puntos";

type UsePortalPuntosOptions = {
  enabled?: boolean;
};

const MISSING_CLIENT_LINK_MESSAGE =
  "Tu cuenta no tiene un cliente vinculado. Contactá a soporte para completar la vinculación.";

export type UsePortalPuntosResult = {
  puntos: PortalPuntosResponse | null;
  summary: ReturnType<typeof getPortalPuntosSummary>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const readErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;

    return data?.message || data?.error || "No se pudieron cargar los puntos";
  }

  return (await response.text().catch(() => "")) || "No se pudieron cargar los puntos";
};

export const usePortalPuntos = ({ enabled = true }: UsePortalPuntosOptions = {}): UsePortalPuntosResult => {
  const [puntos, setPuntos] = useState<PortalPuntosResponse | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadPuntos = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) {
      setPuntos(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/portal/me/puntos", {
        cache: "no-store",
        signal,
      });

      if (response.status === 401) {
        setPuntos(null);
        return;
      }

      if (response.status === 403) {
        setPuntos(null);
        setError(MISSING_CLIENT_LINK_MESSAGE);
        return;
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as PortalPuntosResponse;
      setPuntos(data);
    } catch (requestError) {
      if (signal?.aborted) {
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudieron cargar los puntos",
      );
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setPuntos(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    void loadPuntos(controller.signal);

    return () => {
      controller.abort();
    };
  }, [enabled, loadPuntos]);

  const summary = useMemo(() => getPortalPuntosSummary(puntos), [puntos]);

  return {
    puntos,
    summary,
    isLoading,
    error,
    refresh: async () => {
      await loadPuntos();
    },
  };
};
