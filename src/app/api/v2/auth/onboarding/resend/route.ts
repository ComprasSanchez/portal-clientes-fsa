import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";

type ResendBody = {
  flowId?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<ResendBody>(req);

    if (!body || typeof body.flowId !== "string" || body.flowId.trim().length === 0) {
      return jsonError("invalid_body", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const headers: HeadersInit = {
      "x-request-id": requestId,
      ...(authorization ? { Authorization: authorization } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    };

    const result = await fetchUpstream<unknown>({
      url: `${base}/onboarding/resend`,
      method: "POST",
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