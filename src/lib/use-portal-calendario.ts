"use client";

import { useCallback, useEffect, useState } from "react";
import { mensajeErrorCalendario } from "@/lib/fin-de-anio";
import type {
  CalendarioCasilla,
  CalendarioDelSocio,
  CalendarioRetiro,
} from "@/types/portal-calendario";

/** Error con el código del back y el texto listo para mostrar al socio. */
export class CalendarioAccionError extends Error {
  constructor(public readonly code: string | null) {
    super(mensajeErrorCalendario(code));
  }
}

async function pedir<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    cache: "no-store",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as (T & { code?: unknown }) | null;
  if (!res.ok || !data) {
    const code = data && typeof data.code === "string" ? data.code : null;
    throw new CalendarioAccionError(code);
  }
  return data;
}

/** Calendario de fin de año del socio. Sin cuenta validada no se pide (`enabled`). */
export function usePortalCalendario({ enabled }: { enabled: boolean }) {
  const [calendario, setCalendario] = useState<CalendarioDelSocio | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setCalendario(await pedir<CalendarioDelSocio>("/api/portal/me/calendario"));
    } catch (e) {
      setError(e instanceof Error ? e.message : mensajeErrorCalendario(null));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  // Reemplaza la casilla actualizada sin volver a pedir todo el calendario.
  const actualizarCasilla = useCallback((casilla: CalendarioCasilla) => {
    setCalendario((prev) =>
      prev
        ? { ...prev, casillas: prev.casillas.map((c) => (c.fecha === casilla.fecha ? casilla : c)) }
        : prev,
    );
  }, []);

  const abrir = useCallback(
    async (fecha: string) => {
      const { casilla } = await pedir<{ casilla: CalendarioCasilla }>(
        `/api/portal/me/calendario/dias/${fecha}/apertura`,
        {},
      );
      actualizarCasilla(casilla);
      // El premio puede haber sumado un regalo para retirar.
      if (casilla.resultado?.tipo === "PREMIO" && casilla.resultado.gano) void refresh();
      return casilla;
    },
    [actualizarCasilla, refresh],
  );

  const responderTrivia = useCallback(
    async (fecha: string, respuestas: Record<string, string>) => {
      const { casilla } = await pedir<{ casilla: CalendarioCasilla }>(
        `/api/portal/me/calendario/dias/${fecha}/trivia`,
        { respuestas },
      );
      actualizarCasilla(casilla);
      return casilla;
    },
    [actualizarCasilla],
  );

  const retirar = useCallback(
    async (codigoQr: string) => {
      const retiro = await pedir<CalendarioRetiro>("/api/portal/me/calendario/retiros", { codigoQr });
      void refresh();
      return retiro;
    },
    [refresh],
  );

  return { calendario, isLoading, error, refresh, abrir, responderTrivia, retirar };
}
