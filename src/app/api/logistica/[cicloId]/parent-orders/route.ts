import { NextRequest, NextResponse } from "next/server";
import {
  fetchUpstream,
  getForwardAuthorizationHeader,
  getRequiredBaseUrl,
  jsonError,
} from "@/app/api/_lib/proxy";
import type { ParentOrder } from "@/lib/order-tracking";

const buildForwardHeaders = async (req: NextRequest): Promise<HeadersInit> => {
  const authorization = await getForwardAuthorizationHeader(req.headers.get("authorization"));
  const cookie = req.headers.get("cookie");
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  return {
    "x-request-id": requestId,
    Authorization: authorization,
    ...(cookie ? { Cookie: cookie } : {}),
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

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_BFF_CLIENTE_URL");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const result = await fetchUpstream<ParentOrder[]>({
      url: `${base}/api/v1/logistica/${cicloId}/parent-orders`,
      headers: await buildForwardHeaders(req),
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data ?? [], { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}