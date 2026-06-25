import { useEffect, useState } from "react";
import type { PedidosResponse } from "@/types/portal-pedidos";

type UsePedidosOptions = {
  enabled?: boolean;
  limit?: number;
  offset?: number;
};

export function usePortalPedidos(options: UsePedidosOptions = {}) {
  const { enabled = true, limit = 20, offset = 0 } = options;
  const [data, setData] = useState<PedidosResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    fetch(`/api/portal/me/pedidos?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const ct = res.headers.get("content-type") ?? "";
          const msg = ct.includes("application/json")
            ? ((await res.json()) as { message?: string }).message ??
              "Error al cargar pedidos"
            : await res.text();
          throw new Error(msg);
        }
        return res.json() as Promise<PedidosResponse>;
      })
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Error al cargar pedidos",
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, limit, offset]);

  const latestPedido = data?.pedidos?.[0] ?? null;
  const historial = data?.pedidos?.slice(1) ?? [];

  return { data, latestPedido, historial, isLoading, error };
}
