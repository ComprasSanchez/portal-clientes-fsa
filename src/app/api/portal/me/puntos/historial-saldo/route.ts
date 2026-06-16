import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  withQueryParams,
} from "@/app/api/_lib/proxy";
import type { PortalHistorialSaldoResponse } from "@/types/portal-puntos";

export async function GET(req: NextRequest) {
  try {
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

    const result = await fetchUpstream<PortalHistorialSaldoResponse>({
      url: withQueryParams(req, `${base}/portal/me/puntos/historial-saldo`),
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
