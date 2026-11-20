import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";

export async function PUT(req: NextRequest) {
  try {
    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_SOCIOSA");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const body = await readJsonBody<{ contactId?: unknown }>(req);
    if (!body || typeof body.contactId !== "string" || !body.contactId) {
      return jsonError("invalid_body", 400);
    }

    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const headers: HeadersInit = {
      "x-request-id": requestId,
      ...(authorization ? { Authorization: authorization } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    };

    const result = await fetchUpstream<{ vinculado?: boolean }>({
      url: `${base}/portal/me/chat-atencion`,
      method: "PUT",
      headers,
      body: { contactId: body.contactId },
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data ?? { vinculado: true }, { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}
