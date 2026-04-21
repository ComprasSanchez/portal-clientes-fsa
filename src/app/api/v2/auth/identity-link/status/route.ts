import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  withQueryParams,
} from "@/app/api/_lib/proxy";

type IdentityLinkStatusResponse = {
  ok?: boolean;
  link?: {
    linked?: boolean;
    status?: string;
    clienteId?: string | null;
    kcUserId?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nombre?: string | null;
    apellido?: string | null;
  };
  profile?: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nombre?: string | null;
    apellido?: string | null;
  };
  account?: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
};

export async function GET(req: NextRequest) {
  try {
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

    const result = await fetchUpstream<IdentityLinkStatusResponse>({
      url: withQueryParams(req, `${base}/identity-link/status`),
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