"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PortalSucursalOption } from "@/types/portal-sucursales";

interface SucursalPickerFieldProps {
  /** id del input, para asociarlo a un `<label htmlFor>` externo. */
  inputId?: string;
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

export function SucursalPickerField({
  inputId,
  value,
  initialSucursal,
  onChange,
}: SucursalPickerFieldProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [allSucursales, setAllSucursales] = useState<PortalSucursalOption[]>(allSucursalesCache ?? []);
  const [isLoading, setIsLoading] = useState(!allSucursalesCache);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cierra el dropdown al tocar fuera. No se usa onBlur del input: en iOS Safari el blur
  // llega antes que el click de la opción (y el teclado al cerrarse mueve el layout),
  // así que el dropdown se desmontaba y el tap nunca seleccionaba la sucursal.
  useEffect(() => {
    if (!showDropdown) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showDropdown]);

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
    <div ref={containerRef} className="relative">
      {/* text-base en mobile: con menos de 16px iOS hace zoom al enfocar y desacomoda la pantalla. */}
      <input
        id={inputId}
        className="w-full rounded-2xl border border-[#ddd6eb] px-4 py-3 text-base outline-none transition focus:border-[#8f63d9] sm:text-sm"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onClick={() => setShowDropdown(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setShowDropdown(false);
        }}
        placeholder={isLoading ? "Cargando sucursales..." : "Escribí para filtrar sucursales..."}
        autoComplete="off"
        disabled={isLoading}
      />
      {showDropdown && filteredSucursales.length > 0 ? (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-[#ddd6eb] bg-white shadow-lg"
          // Evita que el input pierda el foco al tocar una opción (no bloquea el scroll táctil).
          onMouseDown={(event) => event.preventDefault()}
        >
          <div className="max-h-56 overflow-y-auto overscroll-contain">
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
