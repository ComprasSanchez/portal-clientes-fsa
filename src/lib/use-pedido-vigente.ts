"use client";

import { useCallback, useEffect, useState } from "react";
import { mapPedidoVigente } from "@/lib/pedido-vigente";
import type {
  PedidoVigenteApi,
  PedidoVigenteRespuesta,
} from "@/types/pedido-vigente";

async function fetchPedidoVigente(
  token: string,
): Promise<PedidoVigenteRespuesta | null> {
  try {
    const res = await fetch(`/api/magic/portal-clientes/${token}/pedido-vigente`);
    if (!res.ok) return null;
    return mapPedidoVigente((await res.json()) as PedidoVigenteApi);
  } catch (error) {
    console.error("Error al consultar el pedido vigente:", error);
    return null;
  }
}

/** Si el ciclo del link ya se cerró, trae el pedido actual del cliente. */
export function usePedidoVigente(token: string | undefined) {
  const [data, setData] = useState<PedidoVigenteRespuesta | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelado = false;
    fetchPedidoVigente(token).then((res) => {
      if (!cancelado) setData(res);
    });
    return () => {
      cancelado = true;
    };
  }, [token]);

  const refetch = useCallback(async () => {
    if (!token) return;
    setData(await fetchPedidoVigente(token));
  }, [token]);

  return { pedidoVigente: data, refetchPedidoVigente: refetch };
}
