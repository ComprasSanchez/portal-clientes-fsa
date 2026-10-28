"use client";

import { useCallback, useEffect, useState } from "react";
import { leerCodigoError, mensajeErrorEvento } from "@/lib/evento-stands";
import type {
  PortalAvanceEvento,
  PortalEscaneoStandResponse,
} from "@/types/portal-evento-stands";

export type EventoAccionResult =
  | { ok: true; standNumero?: number; standNombre?: string }
  | { ok: false; message: string };

export type UsePortalEventoStandsResult = {
  avance: PortalAvanceEvento | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  escanear: (codigo: string) => Promise<EventoAccionResult>;
  entregar: (pin: string) => Promise<EventoAccionResult>;
};

const post = async <T>(url: string, body: unknown) => {
  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => null);
  return res.ok
    ? { ok: true as const, data: data as T }
    : { ok: false as const, message: mensajeErrorEvento(leerCodigoError(data)) };
};

export const usePortalEventoStands = (): UsePortalEventoStandsResult => {
  const [avance, setAvance] = useState<PortalAvanceEvento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/me/evento-stands", { cache: "no-store" });
      const data: unknown = await res.json().catch(() => null);
      if (res.ok) {
        setAvance(data as PortalAvanceEvento);
        setError(null);
      } else {
        setError(mensajeErrorEvento(leerCodigoError(data)));
      }
    } catch {
      setError(mensajeErrorEvento(null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const escanear = useCallback(async (codigo: string): Promise<EventoAccionResult> => {
    try {
      const r = await post<PortalEscaneoStandResponse>(
        "/api/portal/me/evento-stands/escaneos",
        { codigo },
      );
      if (!r.ok) return r;
      setAvance(r.data.avance);
      setError(null);
      const numero = r.data.stand_numero;
      return {
        ok: true,
        standNumero: numero,
        standNombre: r.data.avance.stands.find((s) => s.numero === numero)?.nombre,
      };
    } catch {
      return { ok: false, message: mensajeErrorEvento(null) };
    }
  }, []);

  const entregar = useCallback(async (pin: string): Promise<EventoAccionResult> => {
    try {
      const r = await post<PortalAvanceEvento>("/api/portal/me/evento-stands/entrega", {
        pin,
      });
      if (!r.ok) return r;
      setAvance(r.data);
      return { ok: true };
    } catch {
      return { ok: false, message: mensajeErrorEvento(null) };
    }
  }, []);

  return { avance, loading, error, refresh, escanear, entregar };
};
