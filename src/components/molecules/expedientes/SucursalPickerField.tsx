"use client";

import { useEffect, useMemo, useState } from "react";
import type { PortalSucursalOption } from "@/types/portal-sucursales";

interface SucursalPickerFieldProps {
  value: string;
  initialSucursal?: PortalSucursalOption | null;
  onChange: (sucursalId: string, sucursal: PortalSucursalOption | null) => void;
}

let allSucursalesCache: PortalSucursalOption[] | null = null;
let allSucursalesPromise: Promise<PortalSucursalOption[]> | null = null;

const normalizeSucursalResult = (value: Record<string, unknown>): PortalSucursalOption => ({
  id: Number(value.id ?? value.cod_sucursal ?? 0),
  nombre: String(value.nombre ?? "Sucursal sin nombre"),
  direccion: String(value.direccion ?? "Sin direccion"),
  telefono: typeof value.telefono === "string" ? value.telefono : null,
  empresa_id: typeof value.empresa_id === "number" ? value.empresa_id : undefined,
  formato_id: typeof value.formato_id === "number" ? value.formato_id : undefined,
  cod_sucursal: typeof value.cod_sucursal === "number" ? value.cod_sucursal : undefined,
  latitud: typeof value.latitud === "number" ? value.latitud : null,
  longitud: typeof value.longitud === "number" ? value.longitud : null,
  tolerancia_metros:
    typeof value.tolerancia_metros === "number" ? value.tolerancia_metros : null,
});

const normalizeSucursalesData = (data: unknown): PortalSucursalOption[] => {
  const objectPayload =
    data && !Array.isArray(data) && typeof data === "object"
      ? (data as { sucursales?: unknown[]; items?: unknown[]; data?: unknown[] })
      : null;

  const rawList: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray(objectPayload?.sucursales)
      ? objectPayload.sucursales
      : Array.isArray(objectPayload?.items)
        ? objectPayload.items
        : Array.isArray(objectPayload?.data)
          ? objectPayload.data
          : [];

  return rawList
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map(normalizeSucursalResult)
    .filter((item) => Number.isInteger(item.id) && item.id > 0);
};

function fetchAllSucursales(): Promise<PortalSucursalOption[]> {
  if (allSucursalesCache) return Promise.resolve(allSucursalesCache);
  if (allSucursalesPromise) return allSucursalesPromise;

  allSucursalesPromise = fetch("/api/portal/me/sucursales/search?q=&limit=500", { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) return [];
      const data: unknown = await res.json().catch(() => null);
      return normalizeSucursalesData(data);
    })
    .catch(() => [])
    .then((normalized) => {
      allSucursalesCache = normalized;
      return normalized;
    });

  return allSucursalesPromise;
}

export function prefetchSucursales(): void {
  void fetchAllSucursales();
}

export function SucursalPickerField({ value, initialSucursal, onChange }: SucursalPickerFieldProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [allSucursales, setAllSucursales] = useState<PortalSucursalOption[]>(allSucursalesCache ?? []);
  const [isLoading, setIsLoading] = useState(!allSucursalesCache);

  useEffect(() => {
    let cancelled = false;
    fetchAllSucursales().then((normalized) => {
      if (cancelled) return;
      setAllSucursales(normalized);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSucursales = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return allSucursales;
    return allSucursales.filter(
      (sucursal) =>
        sucursal.nombre.toLowerCase().includes(term) ||
        sucursal.direccion.toLowerCase().includes(term),
    );
  }, [allSucursales, query]);

  const selectedSucursal = useMemo(() => {
    if (!value) return null;
    const fromList = allSucursales.find((sucursal) => String(sucursal.id) === value);
    if (fromList) return fromList;
    return initialSucursal && String(initialSucursal.id) === value ? initialSucursal : null;
  }, [allSucursales, initialSucursal, value]);

  if (selectedSucursal) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-[#d9caef] bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[#2f3042]">{selectedSucursal.nombre}</p>
          <p className="text-xs text-[#6f7085]">{selectedSucursal.direccion}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange("", null);
            setQuery("");
          }}
          className="text-xs font-semibold text-[#6c48b4] hover:underline"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        placeholder={isLoading ? "Cargando sucursales..." : "Escribí para filtrar sucursales..."}
        autoComplete="off"
        disabled={isLoading}
      />
      {showDropdown && filteredSucursales.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-[#ddd6eb] bg-white shadow-lg">
          <div className="max-h-56 overflow-y-auto">
            {filteredSucursales.map((sucursal) => (
              <button
                key={sucursal.id}
                type="button"
                onClick={() => {
                  onChange(String(sucursal.id), sucursal);
                  setQuery("");
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-3 text-left transition hover:bg-[#f6f2ff]"
              >
                <p className="font-semibold text-[#2f3042]">{sucursal.nombre}</p>
                <p className="text-xs text-[#6f7085]">{sucursal.direccion}</p>
              </button>
            ))}
          </div>
        </div>
      ) : showDropdown && !isLoading && query.trim().length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-2xl border border-[#ddd6eb] bg-white shadow-lg">
          <p className="px-4 py-3 text-sm text-[#5f6074]">No encontramos sucursales para esa búsqueda.</p>
        </div>
      ) : null}
    </div>
  );
}
