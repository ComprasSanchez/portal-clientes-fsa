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

export const useAuthLogisticaTracking = ({ cicloId }: UseAuthLogisticaTrackingOptions) => {
  const [isLoading, setIsLoading] = useState(Boolean(cicloId));
  const [error, setError] = useState<string | null>(null);
  const [parentOrders, setParentOrders] = useState<ParentOrder[]>([]);

  const refresh = useCallback(async () => {
    if (!cicloId) {
      setParentOrders([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/logistica/${cicloId}/parent-orders`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as ParentOrder[];
      setParentOrders(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setParentOrders([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No pudimos consultar el estado del pedido.",
      );
    } finally {
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

      setIsLoading(true);

      try {
        const response = await fetch(`/api/logistica/${cicloId}/parent-orders`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = (await response.json()) as ParentOrder[];

        if (!cancelled) {
          setParentOrders(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (requestError) {
        if (!cancelled) {
          setParentOrders([]);
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No pudimos consultar el estado del pedido.",
          );
        }
      } finally {
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
    refresh,
  };
};