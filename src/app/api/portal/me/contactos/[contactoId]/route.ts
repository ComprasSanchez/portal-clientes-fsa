import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
  withQueryParams,
} from "@/app/api/_lib/proxy";

type RouteContext = {
  params: Promise<{
    contactoId: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { contactoId } = await context.params;
    if (!contactoId) {
      return jsonError("missing_contacto_id", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_SOCIOSA");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const body = await readJsonBody<Record<string, unknown>>(req);
    if (!body || typeof body !== "object") {
      return jsonError("invalid_body", 400);
    }

    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const headers: HeadersInit = {
      "x-request-id": requestId,
      ...(authorization ? { Authorization: authorization } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    };

    const result = await fetchUpstream<{ ok?: boolean }>({
      url: withQueryParams(req, `${base}/portal/me/contactos/${contactoId}`),
      method: "PATCH",
      headers,
      body,
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data ?? { ok: true }, { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}