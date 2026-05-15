import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
} from "@/app/api/_lib/proxy";

type RouteContext = {
  params: Promise<{
    contactoId: string;
  }>;
};

type SolicitarOtpResponse = {
  validationFlowId: string;
  expiraAt: string;
  maxIntentos: number;
  otpDebug?: string;
};

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { contactoId } = await context.params;
    if (!contactoId) {
      return jsonError("missing_contacto_id", 400);
    }

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

    const result = await fetchUpstream<SolicitarOtpResponse>({
      url: `${base}/portal/me/contactos/${contactoId}/verificar`,
      method: "POST",
      headers,
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data ?? { ok: true }, { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}
