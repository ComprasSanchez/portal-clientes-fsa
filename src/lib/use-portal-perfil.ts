"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getPortalPerfilSummary } from "@/lib/portal-profile";
import type { PortalPerfilResponse } from "@/types/portal-profile";

type UsePortalPerfilOptions = {
  enabled?: boolean;
};

export type UsePortalPerfilResult = {
  perfil: PortalPerfilResponse | null;
  summary: ReturnType<typeof getPortalPerfilSummary>;
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

    return data?.message || data?.error || "No se pudo cargar el perfil";
  }

  return (await response.text().catch(() => "")) || "No se pudo cargar el perfil";
};

export const usePortalPerfil = ({ enabled = true }: UsePortalPerfilOptions = {}): UsePortalPerfilResult => {
  const [perfil, setPerfil] = useState<PortalPerfilResponse | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadPerfil = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) {
      setIsLoading(false);
      setError(null);
      setPerfil(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/portal/me/perfil", {
        cache: "no-store",
        signal,
      });

      if (response.status === 401 || response.status === 403) {
        setPerfil(null);
        return;
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as PortalPerfilResponse;
      setPerfil(data);
    } catch (requestError) {
      if (signal?.aborted) {
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cargar el perfil",
      );
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setError(null);
      setPerfil(null);
      return;
    }

    const controller = new AbortController();
    void loadPerfil();

    return () => {
      controller.abort();
    };
  }, [enabled, loadPerfil]);

  const summary = useMemo(() => getPortalPerfilSummary(perfil), [perfil]);

  return {
    perfil,
    summary,
    isLoading,
    error,
    refresh: async () => {
      await loadPerfil();
    },
  };
};