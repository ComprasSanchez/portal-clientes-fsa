import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
} from "@/app/api/_lib/proxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await params;
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

    const result = await fetchUpstream<null>({
      url: `${base}/portal/me/notificaciones/${encodeURIComponent(attemptId)}/leida`,
      method: "PATCH",
      headers,
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}
