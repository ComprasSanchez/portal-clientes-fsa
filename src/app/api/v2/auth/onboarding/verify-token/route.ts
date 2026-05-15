import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";
import { applyAuthCookiesFromUpstream } from "@/app/api/auth/_lib/session-cookie";

type VerifyTokenBody = {
  token?: string;
};

type UpstreamResult<T> =
  | {
      ok: true;
      status: number;
      data: T | null;
      headers: Headers;
    }
  | {
      ok: false;
      status: number;
      data: unknown | null;
      text: string | null;
      headers: Headers;
    };

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const requestPrefersHtml = (req: NextRequest) =>
  req.headers.get("accept")?.toLowerCase().includes("text/html") ?? false;

const getErrorCode = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("error" in payload) {
    const error = (payload as { error?: unknown }).error;

    if (typeof error === "string") {
      return error;
    }

    if (error && typeof error === "object" && "code" in error) {
      const code = (error as { code?: unknown }).code;
      return typeof code === "string" ? code : null;
    }
  }

  return null;
};

const buildUpstreamErrorResponse = (result: Extract<UpstreamResult<unknown>, { ok: false }>) => {
  if (result.data !== null) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return jsonError(result.text || "upstream_error", result.status);
};

const buildSuccessJsonResponse = (
  req: NextRequest,
  result: Extract<UpstreamResult<unknown>, { ok: true }>,
) => {
  const response = NextResponse.json(result.data ?? { ok: true }, { status: result.status });
  applyAuthCookiesFromUpstream(req, response, result.headers);
  return response;
};

const verifyTokenUpstream = async (
  req: NextRequest,
  token: string,
): Promise<UpstreamResult<unknown>> => {
  const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
  if (!base) {
    throw new Error("missing_upstream_base");
  }

  const { authorization, cookie, requestId } = buildForwardHeaders(req);
  const upstream = await fetch(`${base}/onboarding/verify-token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-request-id": requestId,
      ...(authorization ? { Authorization: authorization } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({ token }),
    cache: "no-store",
    redirect: "manual",
  });

  const contentType = upstream.headers.get("content-type") || "";

  if (!upstream.ok) {
    if (contentType.includes("application/json")) {
      return {
        ok: false,
        status: upstream.status,
        data: await upstream.json().catch(() => null),
        text: null,
        headers: upstream.headers,
      };
    }

    return {
      ok: false,
      status: upstream.status,
      data: null,
      text: await upstream.text().catch(() => "upstream_error"),
      headers: upstream.headers,
    };
  }

  if (upstream.status === 204 || !contentType.includes("application/json")) {
    return {
      ok: true,
      status: upstream.status,
      data: null,
      headers: upstream.headers,
    };
  }

  return {
    ok: true,
    status: upstream.status,
    data: await upstream.json().catch(() => null),
    headers: upstream.headers,
  };
};

const buildBrowserRedirect = (
  req: NextRequest,
  params: Record<string, string>,
  result?: Extract<UpstreamResult<unknown>, { ok: true }>,
) => {
  const redirectUrl = new URL("/", req.url);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  const response = NextResponse.redirect(redirectUrl);

  if (result) {
    applyAuthCookiesFromUpstream(req, response, result.headers);
  }

  return response;
};

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<VerifyTokenBody>(req);

    if (!isNonEmptyString(body?.token)) {
      return jsonError("invalid_body", 400);
    }

    const result = await verifyTokenUpstream(req, body.token.trim());

    if (!result.ok) {
      return buildUpstreamErrorResponse(result);
    }

    return buildSuccessJsonResponse(req, result);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_upstream_base") {
      return jsonError("missing_upstream_base", 500);
    }

    return jsonError("proxy_failure", 500, String(error));
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")?.trim();

    if (!token) {
      return jsonError("invalid_body", 400);
    }

    const result = await verifyTokenUpstream(req, token);

    if (!result.ok) {
      if (requestPrefersHtml(req)) {
        const errorCode = getErrorCode(result.data) ?? "AUTH_UNKNOWN";
        return buildBrowserRedirect(req, {
          onboarding: "error",
          onboardingError: errorCode,
        });
      }

      return buildUpstreamErrorResponse(result);
    }

    if (requestPrefersHtml(req)) {
      return buildBrowserRedirect(req, { onboarding: "verified" }, result);
    }

    return buildSuccessJsonResponse(req, result);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_upstream_base") {
      return jsonError("missing_upstream_base", 500);
    }

    return jsonError("proxy_failure", 500, String(error));
  }
}
