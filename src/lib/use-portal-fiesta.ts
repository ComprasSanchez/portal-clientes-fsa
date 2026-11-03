"use client";

import { useCallback, useEffect, useState } from "react";
import { leerCodigoError, mensajeErrorFiesta } from "@/lib/fiesta";
import type { PortalMiFiesta } from "@/types/portal-fiesta";

export type FiestaAccionResult = { ok: true } | { ok: false; message: string };

export type UsePortalFiestaResult = {
  fiesta: PortalMiFiesta | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  marcarAsistencia: (codigo: string) => Promise<FiestaAccionResult>;
};

/** Cada cuánto se refrescan puntos y estado de la credencial con la vista abierta. */
const REFRESCO_MS = 20_000;

export const usePortalFiesta = (): UsePortalFiestaResult => {
  const [fiesta, setFiesta] = useState<PortalMiFiesta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/me/fiesta", { cache: "no-store" });
      const data: unknown = await res.json().catch(() => null);
      if (res.ok) {
        setFiesta(data as PortalMiFiesta);
        setError(null);
      } else {
        setError(mensajeErrorFiesta(leerCodigoError(data)));
      }
    } catch {
      setError(mensajeErrorFiesta(null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESCO_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const marcarAsistencia = useCallback(
    async (codigo: string): Promise<FiestaAccionResult> => {
      try {
        const res = await fetch("/api/portal/me/fiesta/asistencia", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo }),
        });
        const data: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          return { ok: false, message: mensajeErrorFiesta(leerCodigoError(data)) };
        }
        setFiesta(data as PortalMiFiesta);
        setError(null);
        return { ok: true };
      } catch {
        return { ok: false, message: mensajeErrorFiesta(null) };
      }
    },
    [],
  );

  return { fiesta, loading, error, refresh, marcarAsistencia };
};
