"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getTrackingStatus,
  ParentOrder,
  TrackingOrderStatus,
} from "@/lib/order-tracking";
import type { DecodedToken } from "@/types/magic-link-type";

const decodeJwt = (token: string): DecodedToken | null => {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

    return JSON.parse(window.atob(padded)) as DecodedToken;
  } catch {
    return null;
  }
};

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

type UsePortalPedidoTrackingOptions = {
  token?: string | null;
};

export const usePortalPedidoTracking = ({ token }: UsePortalPedidoTrackingOptions) => {
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);
  const [parentOrders, setParentOrders] = useState<ParentOrder[]>([]);

  const refresh = useCallback(async () => {
    if (!token) {
      setParentOrders([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const parsedToken = decodeJwt(token);

    if (!parsedToken?.cicloId) {
      setParentOrders([]);
      setError("No pudimos validar el enlace del pedido.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/magic/portal-clientes/${token}/order-cycles/${parsedToken.cicloId}/parent-orders`,
        {
          cache: "no-store",
        },
      );

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
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setParentOrders([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const parsedToken = decodeJwt(token);
      if (!parsedToken?.cicloId) {
        if (!cancelled) {
          setParentOrders([]);
          setError("No pudimos validar el enlace del pedido.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `/api/magic/portal-clientes/${token}/order-cycles/${parsedToken.cicloId}/parent-orders`,
          { cache: "no-store" },
        );

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
  }, [token]);

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
    hasToken: Boolean(token),
    refresh,
  };
};