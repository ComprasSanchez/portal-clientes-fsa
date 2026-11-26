import { NextRequest, NextResponse } from "next/server";
import { buildForwardHeaders, fetchUpstream, getRequiredBaseUrl, jsonError } from "@/app/api/_lib/proxy";

/** Recorrido de Papá Noel (bff-cliente-web → eventos-back). No pide cuenta vinculada. */
export async function GET(req: NextRequest) {
  try {
    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_SOCIOSA");
    if (!base) return jsonError("missing_upstream_base", 500);

    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const result = await fetchUpstream<unknown>({
      url: `${base}/portal/me/tour-papa-noel`,
      headers: {
        "x-request-id": requestId,
        ...(authorization ? { Authorization: authorization } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
    });
    if (!result.ok) return result.response;
    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}
