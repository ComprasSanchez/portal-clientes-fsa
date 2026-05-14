import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";
import { applyAuthCookiesFromUpstream } from "@/app/api/auth/_lib/session-cookie";

type IdentityLinkVerifyBody = {
  linkId?: string;
  code?: string;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const buildUpstreamErrorResponse = async (upstream: Response) => {
  const contentType = upstream.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await upstream.json().catch(() => null);
    return NextResponse.json(data ?? { ok: false, error: "upstream_error" }, {
      status: upstream.status,
    });
  }

  const text = await upstream.text().catch(() => "upstream_error");
  return jsonError(text || "upstream_error", upstream.status);
};

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<IdentityLinkVerifyBody>(req);

    if (!body || !isNonEmptyString(body.linkId) || !isNonEmptyString(body.code)) {
      return jsonError("invalid_body", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const upstream = await fetch(`${base}/identity-link/verify`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(authorization ? { Authorization: authorization } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
      redirect: "manual",
    });

    if (!upstream.ok) {
      return await buildUpstreamErrorResponse(upstream);
    }

    const data = await upstream.json().catch(() => null);
    const response = NextResponse.json(data ?? { ok: true }, { status: upstream.status });
    applyAuthCookiesFromUpstream(req, response, upstream.headers);
    return response;
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}
