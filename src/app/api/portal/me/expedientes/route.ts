import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
  withQueryParams,
} from "@/app/api/_lib/proxy";
import type { PortalExpedientesResponse } from "@/types/portal-expedientes";
import type {
  PortalCreateExpedienteRequest,
  PortalCreateExpedienteResponse,
} from "@/types/portal-expediente-mutations";

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

    const url = withQueryParams(req, `${base}/portal/me/expedientes`);
    const result = await fetchUpstream<PortalExpedientesResponse>({
      url,
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

export async function POST(req: NextRequest) {
  try {
    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_SOCIOSA");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const body = await readJsonBody<PortalCreateExpedienteRequest>(req);
    if (!body || typeof body !== "object") {
      return jsonError("invalid_body", 400);
    }

    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const headers: HeadersInit = {
      "x-request-id": requestId,
      ...(authorization ? { Authorization: authorization } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    };

    const result = await fetchUpstream<PortalCreateExpedienteResponse>({
      url: withQueryParams(req, `${base}/portal/me/expedientes`),
      method: "POST",
      headers,
      body,
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}
