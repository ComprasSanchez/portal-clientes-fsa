"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getTrackingStatus,
  ParentOrder,
  TrackingOrderStatus,
} from "@/lib/order-tracking";

const readErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await response.json().catch(() => null)) as
      | { message?: string; error?: string }
      | null;

    return data?.message || data?.error || "No pudimos consultar el estado del pedido.";
  }

  return (await response.text().catch(() => "")) || "No pudimos consultar el estado del pedido.";
};

type UseAuthLogisticaTrackingOptions = {
  cicloId?: string | null;
};

type TrackingCacheEntry = {
  data: ParentOrder[];
  error: string | null;
  promise: Promise<ParentOrder[]> | null;
};

const trackingCache = new Map<string, TrackingCacheEntry>();

const getTrackingCacheEntry = (cicloId: string) => {
  const existing = trackingCache.get(cicloId);

  if (existing) {
    return existing;
  }

  const created: TrackingCacheEntry = {
    data: [],
    error: null,
    promise: null,
  };

  trackingCache.set(cicloId, created);
  return created;
};

export const useAuthLogisticaTracking = ({ cicloId }: UseAuthLogisticaTrackingOptions) => {
  const cachedEntry = cicloId ? getTrackingCacheEntry(cicloId) : null;
  const [isLoading, setIsLoading] = useState(Boolean(cicloId) && !cachedEntry?.data.length && !cachedEntry?.error);
  const [error, setError] = useState<string | null>(cachedEntry?.error ?? null);
  const [parentOrders, setParentOrders] = useState<ParentOrder[]>(cachedEntry?.data ?? []);

  const refresh = useCallback(async (force = false) => {
    if (!cicloId) {
      setParentOrders([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const cacheEntry = getTrackingCacheEntry(cicloId);

    if (!force && (cacheEntry.data.length > 0 || cacheEntry.error)) {
      setParentOrders(cacheEntry.data);
      setError(cacheEntry.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!cacheEntry.promise || force) {
        cacheEntry.promise = fetch(`/api/logistica/${cicloId}/parent-orders`, {
          cache: "no-store",
        }).then(async (response) => {
          if (!response.ok) {
            throw new Error(await readErrorMessage(response));
          }

          const data = (await response.json()) as ParentOrder[];
          return Array.isArray(data) ? data : [];
        });
      }

      const data = await cacheEntry.promise;
      cacheEntry.data = data;
      cacheEntry.error = null;
      setParentOrders(data);
    } catch (requestError) {
      const nextError =
        requestError instanceof Error
          ? requestError.message
          : "No pudimos consultar el estado del pedido.";

      cacheEntry.data = [];
      cacheEntry.error = nextError;
      setParentOrders([]);
      setError(nextError);
    } finally {
      cacheEntry.promise = null;
      setIsLoading(false);
    }
  }, [cicloId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!cicloId) {
        setParentOrders([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      const cacheEntry = getTrackingCacheEntry(cicloId);

      if (cacheEntry.data.length > 0 || cacheEntry.error) {
        setParentOrders(cacheEntry.data);
        setError(cacheEntry.error);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        if (!cacheEntry.promise) {
          cacheEntry.promise = fetch(`/api/logistica/${cicloId}/parent-orders`, {
            cache: "no-store",
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error(await readErrorMessage(response));
            }

            const data = (await response.json()) as ParentOrder[];
            return Array.isArray(data) ? data : [];
          });
        }

        const data = await cacheEntry.promise;
        cacheEntry.data = data;
        cacheEntry.error = null;

        if (!cancelled) {
          setParentOrders(data);
          setError(null);
        }
      } catch (requestError) {
        const nextError =
          requestError instanceof Error
            ? requestError.message
            : "No pudimos consultar el estado del pedido.";

        cacheEntry.data = [];
        cacheEntry.error = nextError;

        if (!cancelled) {
          setParentOrders([]);
          setError(nextError);
        }
      } finally {
        cacheEntry.promise = null;

        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [cicloId]);

  const latestParentOrder = parentOrders[0] ?? null;
  const trackingStatus = useMemo<TrackingOrderStatus>(
    () => (latestParentOrder ? getTrackingStatus(latestParentOrder) : "pendiente"),
    [latestParentOrder],
  );
  const resolvedOrderNumber = useMemo(
    () => latestParentOrder?.code ?? latestParentOrder?.orders?.[0]?.nroPedido ?? null,
    [latestParentOrder],
  );

  return {
    isLoading,
    error,
    parentOrders,
    latestParentOrder,
    trackingStatus,
    resolvedOrderNumber,
    hasCicloId: Boolean(cicloId),
    refresh: () => refresh(true),
  };
};