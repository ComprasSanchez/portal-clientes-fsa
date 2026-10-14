import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
} from "@/app/api/_lib/proxy";
import type { PedidoDetalleResponse } from "@/types/portal-pedidos";

type RouteContext = {
  params: Promise<{
    idPedido: string;
  }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { idPedido } = await context.params;
    if (!idPedido) {
      return jsonError("missing_id_pedido", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_SOCIOSA");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const headers: HeadersInit = {
      "x-request-id": requestId,
      ...(authorization ? { Authorization: authorization } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    };

    const result = await fetchUpstream<PedidoDetalleResponse>({
      url: `${base}/portal/me/pedidos/${encodeURIComponent(idPedido)}`,
      headers,
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}
