import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
} from "@/app/api/_lib/proxy";

const getLegacyBaseUrl = () =>
  getRequiredBaseUrl("CRM_WEBSERVICE_BASE_URL") ?? "http://localhost:3001";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ dni: string }> },
) {
  try {
    const { dni } = await ctx.params;

    if (!dni?.trim()) {
      return jsonError("dni_requerido", 400);
    }

    const base = getLegacyBaseUrl();
    const { requestId } = buildForwardHeaders(req);

    const result = await fetchUpstream<unknown>({
      url: `${base}/cliente/${encodeURIComponent(dni.trim())}`,
      method: "GET",
      headers: { "x-request-id": requestId },
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data ?? { found: false }, {
      status: result.status,
    });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}
