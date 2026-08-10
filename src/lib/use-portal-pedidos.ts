"use client";

import { useCallback, useEffect, useState } from "react";
import type { PedidosResponse } from "@/types/portal-pedidos";

type UsePedidosOptions = {
  enabled?: boolean;
  limit?: number;
  offset?: number;
};

type PedidosCacheEntry = {
  payload: PedidosResponse | null;
  error: string | null;
  promise: Promise<PedidosResponse | null> | null;
};

const pedidosCache = new Map<string, PedidosCacheEntry>();

const getCacheKey = (limit: number, offset: number) => `${limit}:${offset}`;

const getPedidosCacheEntry = (cacheKey: string): PedidosCacheEntry => {
  const existingEntry = pedidosCache.get(cacheKey);

  if (existingEntry) {
    return existingEntry;
  }

  const nextEntry: PedidosCacheEntry = {
    payload: null,
    error: null,
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
  const { enabled = true, limit = 20, offset = 0 } = options;
  const cacheKey = getCacheKey(limit, offset);
  const cacheEntry = getPedidosCacheEntry(cacheKey);

  const [data, setData] = useState<PedidosResponse | null>(cacheEntry.payload);
  const [isLoading, setIsLoading] = useState(
    enabled && !cacheEntry.payload && !cacheEntry.error,
  );
  const [error, setError] = useState<string | null>(cacheEntry.error);

  const loadPedidos = useCallback(
    async (signal?: AbortSignal, force = false) => {
      const currentEntry = getPedidosCacheEntry(cacheKey);

      if (!enabled) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        if (force) {
          currentEntry.payload = null;
          currentEntry.error = null;
          currentEntry.promise = null;
        }

        if (!currentEntry.promise) {
          currentEntry.promise = (async () => {
            const params = new URLSearchParams();
            params.set("limit", String(limit));
            params.set("offset", String(offset));

            const response = await fetch(
              `/api/portal/me/pedidos?${params.toString()}`,
              { cache: "no-store", signal },
            );

            if (!response.ok) {
              throw new Error(await readErrorMessage(response));
            }

            return (await response.json()) as PedidosResponse;
          })();
        }

        const result = await currentEntry.promise;
        currentEntry.payload = result;
        currentEntry.error = null;
        setData(result);
      } catch (requestError) {
        if (signal?.aborted) {
          return;
        }

        const nextError =
          requestError instanceof Error
            ? requestError.message
            : "Error al cargar pedidos";

        currentEntry.payload = null;
        currentEntry.error = nextError;
        setData(null);
        setError(nextError);
      } finally {
        currentEntry.promise = null;

        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [cacheKey, enabled, limit, offset],
  );

  useEffect(() => {
    const currentEntry = getPedidosCacheEntry(cacheKey);

    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setData(currentEntry.payload);
    setError(currentEntry.error);

    if (currentEntry.payload || currentEntry.error) {
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
