import { NextRequest, NextResponse } from "next/server";
import {
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
} from "@/app/api/_lib/proxy";
import type { PortalPerfilResponse } from "@/types/portal-profile";

const buildForwardHeaders = (req: NextRequest) => {
  const authorization = req.headers.get("authorization")?.trim() || null;
  const cookie = req.headers.get("cookie");
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  return {
    authorization,
    cookie,
    requestId,
  };
};

export async function GET(req: NextRequest) {
  try {
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

    const result = await fetchUpstream<PortalPerfilResponse>({
      url: `${base}/portal/me/perfil`,
      headers,
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}