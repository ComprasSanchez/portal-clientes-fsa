import { NextRequest, NextResponse } from "next/server";
import {
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
} from "@/app/api/_lib/proxy";
import type { ParentOrder } from "@/lib/order-tracking";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cicloId: string }> },
) {
  try {
    const { cicloId } = await params;
    if (!cicloId?.trim()) {
      return jsonError("missing_ciclo_id", 400);
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

    const result = await fetchUpstream<ParentOrder[]>({
      url: `${base}/logistica/${cicloId}/parent-orders`,
      headers,
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data ?? [], { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}