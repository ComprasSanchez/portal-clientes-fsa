"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  PedidoCanal,
  PedidoNormalizado,
  PedidosResponse,
} from "@/types/portal-pedidos";

type UsePedidosOptions = {
  enabled?: boolean;
  limit?: number;
  offset?: number;
  /** Sin valor trae todos los canales. */
  canal?: PedidoCanal;
};

type PedidosCacheEntry = {
  payload: PedidosResponse | null;
  promise: Promise<PedidosResponse | null> | null;
};

const pedidosCache = new Map<string, PedidosCacheEntry>();

const getCacheKey = (limit: number, offset: number, canal?: PedidoCanal) =>
  `${limit}:${offset}:${canal ?? "TODOS"}`;

/** Busca un pedido en cualquier listado ya cargado (para abrir el detalle sin esperar). */
export const findPedidoEnCache = (idPedido: string): PedidoNormalizado | null => {
  for (const entry of pedidosCache.values()) {
    const found = entry.payload?.pedidos.find((p) => p.id_pedido === idPedido);
    if (found) return found;
  }
  return null;
};

const getPedidosCacheEntry = (cacheKey: string): PedidosCacheEntry => {
  const existingEntry = pedidosCache.get(cacheKey);

  if (existingEntry) {
    return existingEntry;
  }

  const nextEntry: PedidosCacheEntry = {
    payload: null,
    promise: null,
  };

  pedidosCache.set(cacheKey, nextEntry);
  return nextEntry;
};

const readErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  const msg = contentType.includes("application/json")
    ? ((await response.json().catch(() => null)) as {
        message?: string;
      } | null)?.message
    : await response.text().catch(() => "");

  return msg || "Error al cargar pedidos";
};

export function usePortalPedidos(options: UsePedidosOptions = {}) {
  const { enabled = true, limit = 20, offset = 0, canal } = options;
  const cacheKey = getCacheKey(limit, offset, canal);
  const cacheEntry = getPedidosCacheEntry(cacheKey);

  const [data, setData] = useState<PedidosResponse | null>(cacheEntry.payload);
  const [isLoading, setIsLoading] = useState(enabled && !cacheEntry.payload);
  const [error, setError] = useState<string | null>(null);

  const loadPedidos = useCallback(
    async (signal?: AbortSignal, force = false) => {
      const currentEntry = getPedidosCacheEntry(cacheKey);

      if (!enabled) {
        setIsLoading(false);
        return;
      }

      if (force) {
        currentEntry.payload = null;
        currentEntry.promise = null;
      }

      // La request compartida NO se ata al `signal` de un componente: si se abortara al
      // desmontar (p. ej. el doble montaje de Strict Mode), el siguiente que se enganche a la
      // misma promesa recibiría un abort y lo mostraría como error. El `signal` solo decide
      // si este componente sigue interesado en el resultado.
      if (!currentEntry.promise) {
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        params.set("offset", String(offset));
        if (canal) params.set("canal", canal);

        const request = (async () => {
          const response = await fetch(
            `/api/portal/me/pedidos?${params.toString()}`,
            { cache: "no-store" },
          );

          if (!response.ok) {
            throw new Error(await readErrorMessage(response));
          }

          return (await response.json()) as PedidosResponse;
        })();

        currentEntry.promise = request;
        request
          .then((result) => {
            currentEntry.payload = result;
          })
          .catch(() => undefined)
          .finally(() => {
            if (currentEntry.promise === request) currentEntry.promise = null;
          });
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await currentEntry.promise;
        if (signal?.aborted) return;

        setData(result);
      } catch (requestError) {
        if (signal?.aborted) return;

        // El error no se guarda en la caché: al volver a la pestaña se reintenta.
        setData(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Error al cargar pedidos",
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [cacheKey, enabled, limit, offset, canal],
  );

  useEffect(() => {
    const currentEntry = getPedidosCacheEntry(cacheKey);

    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setData(currentEntry.payload);
    setError(null);

    if (currentEntry.payload) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    void loadPedidos(controller.signal);

    return () => {
      controller.abort();
    };
  }, [cacheKey, enabled, loadPedidos]);

  const latestPedido = data?.pedidos?.[0] ?? null;
  const historial = data?.pedidos?.slice(1) ?? [];

  return {
    data,
    latestPedido,
    historial,
    isLoading,
    error,
    refresh: async () => {
      await loadPedidos(undefined, true);
    },
  };
}
