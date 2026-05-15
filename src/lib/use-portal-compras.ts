"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getPortalComprasSummary } from "@/lib/portal-compras";
import type { PortalComprasResponse } from "@/types/portal-compras";

type UsePortalComprasOptions = {
  enabled?: boolean;
  limit?: number;
  offset?: number;
};

export type UsePortalComprasResult = {
  compras: PortalComprasResponse | null;
  summary: ReturnType<typeof getPortalComprasSummary>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

type ComprasCacheEntry = {
  payload: PortalComprasResponse | null;
  error: string | null;
  promise: Promise<PortalComprasResponse | null> | null;
};

const comprasCache = new Map<string, ComprasCacheEntry>();

const getCacheKey = (limit: number, offset: number) => `${limit}:${offset}`;

const getComprasCacheEntry = (cacheKey: string): ComprasCacheEntry => {
  const existingEntry = comprasCache.get(cacheKey);

  if (existingEntry) {
    return existingEntry;
  }

  const nextEntry: ComprasCacheEntry = {
    payload: null,
    error: null,
    promise: null,
  };

  comprasCache.set(cacheKey, nextEntry);
  return nextEntry;
};

const readErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;

    return data?.message || data?.error || "No se pudo cargar la facturacion";
  }

  return (await response.text().catch(() => "")) || "No se pudo cargar la facturacion";
};

export const usePortalCompras = ({
  enabled = true,
  limit = 20,
  offset = 0,
}: UsePortalComprasOptions = {}): UsePortalComprasResult => {
  const cacheKey = getCacheKey(limit, offset);
  const cacheEntry = getComprasCacheEntry(cacheKey);
  const [compras, setCompras] = useState<PortalComprasResponse | null>(cacheEntry.payload);
  const [isLoading, setIsLoading] = useState(
    enabled && !cacheEntry.payload && !cacheEntry.error,
  );
  const [error, setError] = useState<string | null>(cacheEntry.error);

  const loadCompras = useCallback(async (signal?: AbortSignal, force = false) => {
    const currentEntry = getComprasCacheEntry(cacheKey);

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
          const response = await fetch(`/api/portal/me/compras?limit=${limit}&offset=${offset}`, {
            cache: "no-store",
            signal,
          });

          if (response.status === 401 || response.status === 403) {
            return null;
          }

          if (!response.ok) {
            throw new Error(await readErrorMessage(response));
          }

          return (await response.json()) as PortalComprasResponse;
        })();
      }

      const data = await currentEntry.promise;
      currentEntry.payload = data;
      currentEntry.error = null;
      setCompras(data);
    } catch (requestError) {
      if (signal?.aborted) {
        return;
      }

      const nextError =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cargar la facturacion";

      currentEntry.payload = null;
      currentEntry.error = nextError;
      setCompras(null);
      setError(nextError);
    } finally {
      currentEntry.promise = null;

      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [cacheKey, enabled, limit, offset]);

  useEffect(() => {
    const currentEntry = getComprasCacheEntry(cacheKey);

    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setCompras(currentEntry.payload);
    setError(currentEntry.error);

    if (currentEntry.payload || currentEntry.error) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    void loadCompras(controller.signal);

    return () => {
      controller.abort();
    };
  }, [cacheKey, enabled, loadCompras]);

  const summary = useMemo(() => getPortalComprasSummary(compras), [compras]);

  return {
    compras,
    summary,
    isLoading,
    error,
    refresh: async () => {
      await loadCompras(undefined, true);
    },
  };
};