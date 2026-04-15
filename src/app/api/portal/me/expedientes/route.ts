import { NextRequest, NextResponse } from "next/server";
import {
  applyUserTokenCookies,
  clearUserTokenCookies,
  fetchUpstream,
  getForwardAuthorizationHeader,
  getRequiredBaseUrl,
  jsonError,
  withQueryParams,
} from "@/app/api/_lib/proxy";
import type { PortalExpedientesResponse } from "@/types/portal-expedientes";

const buildForwardHeaders = async (req: NextRequest) => {
  const auth = await getForwardAuthorizationHeader(req, req.headers.get("authorization"));
  const cookie = req.headers.get("cookie");
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  return {
    auth,
    headers: {
      "x-request-id": requestId,
      Authorization: auth.authorization,
      ...(cookie ? { Cookie: cookie } : {}),
    } satisfies HeadersInit,
  };
};

export async function GET(req: NextRequest) {
  try {
    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_BFF_CLIENTE_URL");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const { auth, headers } = await buildForwardHeaders(req);
    const url = withQueryParams(req, `${base}/api/v1/portal/me/expedientes`);
    const result = await fetchUpstream<PortalExpedientesResponse>({
      url,
      headers,
    });

    if (!result.ok) {
      if (auth.refreshedUserTokens) {
        applyUserTokenCookies(result.response, auth.refreshedUserTokens, req.nextUrl.protocol === "https:");
      }
      if (auth.shouldClearUserTokens) {
        clearUserTokenCookies(result.response);
      }
      return result.response;
    }

    const response = NextResponse.json(result.data, { status: result.status });
    if (auth.refreshedUserTokens) {
      applyUserTokenCookies(response, auth.refreshedUserTokens, req.nextUrl.protocol === "https:");
    }
    if (auth.shouldClearUserTokens) {
      clearUserTokenCookies(response);
    }

    return response;
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}