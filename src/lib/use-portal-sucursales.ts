"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortalSucursalesResponse, PortalSucursalOption } from "@/types/portal-sucursales";
import type { Sucursal } from "@/types/sucursal";

function normalizeResponse(data: PortalSucursalesResponse): PortalSucursalOption[] {
  if (Array.isArray(data)) return data;
  return data.sucursales ?? data.items ?? data.data ?? [];
}

// TODO: remover este set cuando se habiliten estas sucursales
const SUCURSALES_OCULTAS = new Set([72, 76, 77, 78, 79, 80, 81]);

function toSucursal(s: PortalSucursalOption): Sucursal | null {
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

      const response = await fetch("/api/portal/me/sucursales/search?q=&limit=500", {
        cache: "no-store",
        signal,
      });

      if (response.status === 401) {
        setSucursales([]);
        return;
      }

      if (response.status === 403) {
        setSucursales([]);
        setError("Tu cuenta no tiene un cliente vinculado.");
        return;
      }

      if (!response.ok) {
        throw new Error("No se pudieron cargar las sucursales.");
      }

      const data = (await response.json()) as PortalSucursalesResponse;
      const items = normalizeResponse(data);
      const mapped = items.map(toSucursal).filter((s): s is Sucursal => s !== null);
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
