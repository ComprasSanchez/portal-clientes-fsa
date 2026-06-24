"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortalHorarioSucursalItem, PortalSucursalesResponse, PortalSucursalOption } from "@/types/portal-sucursales";
import type { Sucursal } from "@/types/sucursal";

// dia_id: 1=Lun … 6=Sáb … 7=Dom
const DIA_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function formatTime(hms: string): string {
  const [h, m] = hms.split(":");
  return `${parseInt(h, 10)}:${m}`;
}

function formatHorarios(horarios: PortalHorarioSucursalItem[]): string {
  if (!horarios.length) return "";

  const sorted = [...horarios].sort((a, b) => a.dia_id - b.dia_id);

  // Group consecutive days that share the same open/close time
  const groups: { dias: number[]; apertura: string; cierre: string }[] = [];
  for (const h of sorted) {
    const ap = h.hora_apertura.slice(0, 5);
    const ci = h.hora_cierre.slice(0, 5);
    const last = groups[groups.length - 1];
    if (
      last &&
      last.apertura === ap &&
      last.cierre === ci &&
      h.dia_id === last.dias[last.dias.length - 1] + 1
    ) {
      last.dias.push(h.dia_id);
    } else {
      groups.push({ dias: [h.dia_id], apertura: ap, cierre: ci });
    }
  }

  return groups
    .map(({ dias, apertura, cierre }) => {
      const from = DIA_LABELS[dias[0] - 1];
      const to = DIA_LABELS[dias[dias.length - 1] - 1];
      const dayRange = dias.length === 1 ? from : `${from}-${to}`;
      if (apertura === "00:00" && cierre === "23:59") return `${dayRange} 24 hs`;
      return `${dayRange} ${formatTime(apertura)} - ${formatTime(cierre)}`;
    })
    .join(" | ");
}

function normalizeResponse(data: PortalSucursalesResponse): PortalSucursalOption[] {
  if (Array.isArray(data)) return data;
  return data.sucursales ?? data.items ?? data.data ?? [];
}

// TODO: remover este set cuando se habiliten estas sucursales
const SUCURSALES_OCULTAS = new Set([72, 76, 77, 78, 79, 80, 81]);

function toSucursal(s: PortalSucursalOption, horariosMap: Map<number, PortalHorarioSucursalItem[]>): Sucursal | null {
  if (SUCURSALES_OCULTAS.has(s.id)) return null;
  if (!s.latitud || !s.longitud) return null;
  return {
    id: String(s.id),
    nombre: s.nombre,
    direccion: s.direccion,
    ciudad: "",
    provincia: "",
    telefono: s.telefono ?? undefined,
    lat: s.latitud,
    lng: s.longitud,
    horarios: formatHorarios(horariosMap.get(s.id) ?? []) || undefined,
    activa: true,
  };
}

export function usePortalSucursales() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);

      const [sucursalesRes, horariosRes] = await Promise.all([
        fetch("/api/portal/me/sucursales/search?q=&limit=500", { cache: "no-store", signal }),
        fetch("/api/portal/me/sucursales/horarios", { cache: "no-store", signal }),
      ]);

      if (sucursalesRes.status === 401) {
        setSucursales([]);
        return;
      }

      if (sucursalesRes.status === 403) {
        setSucursales([]);
        setError("Tu cuenta no tiene un cliente vinculado.");
        return;
      }

      if (!sucursalesRes.ok) {
        throw new Error("No se pudieron cargar las sucursales.");
      }

      const sucursalesData = (await sucursalesRes.json()) as PortalSucursalesResponse;
      const items = normalizeResponse(sucursalesData);

      // Build horarios lookup keyed by sucursal_id — best-effort, silently ignored on error
      const horariosMap = new Map<number, PortalHorarioSucursalItem[]>();
      if (horariosRes.ok) {
        const raw = (await horariosRes.json()) as unknown;
        const list = Array.isArray(raw) ? (raw as PortalHorarioSucursalItem[]) : [];
        for (const h of list) {
          const bucket = horariosMap.get(h.sucursal_id) ?? [];
          bucket.push(h);
          horariosMap.set(h.sucursal_id, bucket);
        }
      }

      const mapped = items
        .map((s) => toSucursal(s, horariosMap))
        .filter((s): s is Sucursal => s !== null);

      setSucursales(mapped);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : "No se pudieron cargar las sucursales.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { sucursales, isLoading, error, refresh: () => load() };
}
