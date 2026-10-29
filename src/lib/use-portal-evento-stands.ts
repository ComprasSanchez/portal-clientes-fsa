"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { leerCodigoError, mensajeErrorEvento } from "@/lib/evento-stands";
import type {
  PortalAvanceEvento,
  PortalEscaneoStandResponse,
} from "@/types/portal-evento-stands";

export type EventoAccionResult =
  | { ok: true; standNumero?: number; standNombre?: string; yaEscaneado?: boolean }
  | { ok: false; message: string };

export type UsePortalEventoStandsResult = {
  avance: PortalAvanceEvento | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  escanear: (codigo: string) => Promise<EventoAccionResult>;
  entregar: (pin: string, dni?: string) => Promise<EventoAccionResult>;
  aceptarTerminos: () => Promise<EventoAccionResult>;
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
  // Avance previo al escaneo: el registro es idempotente, así que comparar
  // contra lo que ya tenía es lo que dice si el QR estaba escaneado.
  const avanceRef = useRef<PortalAvanceEvento | null>(null);
  useEffect(() => {
    avanceRef.current = avance;
  }, [avance]);

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
      const numero = r.data.stand_numero;
      const yaEscaneado = !!avanceRef.current?.stands.find((s) => s.numero === numero)
        ?.escaneado;
      setAvance(r.data.avance);
      setError(null);
      return {
        ok: true,
        standNumero: numero,
        standNombre: r.data.avance.stands.find((s) => s.numero === numero)?.nombre,
        yaEscaneado,
      };
    } catch {
      return { ok: false, message: mensajeErrorEvento(null) };
    }
  }, []);

  const entregar = useCallback(async (pin: string, dni?: string): Promise<EventoAccionResult> => {
    try {
      const r = await post<PortalAvanceEvento>(
        "/api/portal/me/evento-stands/entrega",
        dni ? { pin, dni } : { pin },
      );
      if (!r.ok) return r;
      setAvance(r.data);
      return { ok: true };
    } catch {
      return { ok: false, message: mensajeErrorEvento(null) };
    }
  }, []);

  const aceptarTerminos = useCallback(async (): Promise<EventoAccionResult> => {
    try {
      const r = await post<PortalAvanceEvento>("/api/portal/me/evento-stands/terminos", {});
      if (!r.ok) return r;
      setAvance(r.data);
      return { ok: true };
    } catch {
      return { ok: false, message: mensajeErrorEvento(null) };
    }
  }, []);

  return { avance, loading, error, refresh, escanear, entregar, aceptarTerminos };
};
