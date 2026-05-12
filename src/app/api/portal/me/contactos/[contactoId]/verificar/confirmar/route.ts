import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";

type RouteContext = {
  params: Promise<{
    contactoId: string;
  }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { contactoId } = await context.params;
    if (!contactoId) {
      return jsonError("missing_contacto_id", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_SOCIOSA");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const body = await readJsonBody<{ codigo: string }>(req);
    if (!body || typeof body.codigo !== "string") {
      return jsonError("invalid_body", 400);
    }

    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const headers: HeadersInit = {
      "x-request-id": requestId,
      ...(authorization ? { Authorization: authorization } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    };

    const result = await fetchUpstream<null>({
      url: `${base}/portal/me/contactos/${contactoId}/verificar/confirmar`,
      method: "POST",
      headers,
      body,
    });

    if (!result.ok) {
      return result.response;
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}
