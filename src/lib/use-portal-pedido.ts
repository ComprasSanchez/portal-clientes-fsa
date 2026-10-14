"use client";

import { useEffect, useState } from "react";
import type {
  PedidoDetalleResponse,
  PedidoNormalizado,
} from "@/types/portal-pedidos";
import { findPedidoEnCache } from "./use-portal-pedidos";

const pedidoCache = new Map<string, PedidoNormalizado>();

type FetchResult = {
  id: string;
  pedido: PedidoNormalizado | null;
  notFound: boolean;
  error: string | null;
};

const lookupCache = (idPedido: string) =>
  pedidoCache.get(idPedido) ?? findPedidoEnCache(idPedido);

/**
 * Detalle de un pedido. Si ya vino en algún listado se muestra al instante;
 * si no (recarga, link abierto en otra pestaña) se pide a `/api/portal/me/pedidos/:id`.
 */
export function usePortalPedido(idPedido: string | null) {
  const [result, setResult] = useState<FetchResult | null>(null);

  const cached = idPedido ? lookupCache(idPedido) : null;
  const needsFetch = Boolean(idPedido && !cached);

  useEffect(() => {
    if (!idPedido || !needsFetch) return;

    let cancelled = false;
    const finish = (partial: Omit<FetchResult, "id">) => {
      if (!cancelled) setResult({ id: idPedido, ...partial });
    };

    void fetch(`/api/portal/me/pedidos/${encodeURIComponent(idPedido)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (response.status === 404) {
          finish({ pedido: null, notFound: true, error: null });
          return;
        }
        if (!response.ok) {
          finish({ pedido: null, notFound: false, error: "Error al cargar el pedido" });
          return;
        }
        const data = (await response.json()) as PedidoDetalleResponse;
        pedidoCache.set(idPedido, data.pedido);
        finish({ pedido: data.pedido, notFound: false, error: null });
      })
      .catch(() => {
        finish({ pedido: null, notFound: false, error: "Error al cargar el pedido" });
      });

    return () => {
      cancelled = true;
    };
  }, [idPedido, needsFetch]);

  if (!idPedido) {
    return { pedido: null, isLoading: false, notFound: false, error: null };
  }
  if (cached) {
    return { pedido: cached, isLoading: false, notFound: false, error: null };
  }
  // Resultado de otro id (navegación rápida entre pedidos): todavía cargando el actual.
  if (!result || result.id !== idPedido) {
    return { pedido: null, isLoading: true, notFound: false, error: null };
  }
  return {
    pedido: result.pedido,
    isLoading: false,
    notFound: result.notFound,
    error: result.error,
  };
}
