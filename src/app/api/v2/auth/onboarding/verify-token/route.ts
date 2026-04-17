import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";

type VerifyTokenBody = {
  token?: string;
};

const getHeaders = (req: NextRequest) => {
  const { authorization, cookie, requestId } = buildForwardHeaders(req);

  return {
    "x-request-id": requestId,
    ...(authorization ? { Authorization: authorization } : {}),
    ...(cookie ? { Cookie: cookie } : {}),
  } satisfies HeadersInit;
};

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<VerifyTokenBody>(req);

    if (!body || typeof body.token !== "string" || body.token.trim().length === 0) {
      return jsonError("invalid_body", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const result = await fetchUpstream<unknown>({
      url: `${base}/onboarding/verify-token`,
      method: "POST",
      headers: getHeaders(req),
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

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")?.trim();

    if (!token) {
      return jsonError("invalid_body", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const result = await fetchUpstream<unknown>({
      url: `${base}/onboarding/verify-token?token=${encodeURIComponent(token)}`,
      method: "GET",
      headers: getHeaders(req),
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data ?? { ok: true }, { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}