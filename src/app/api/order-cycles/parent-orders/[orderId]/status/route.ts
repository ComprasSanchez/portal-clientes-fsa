import { NextRequest, NextResponse } from "next/server";
import {
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";

type ParentOrderStatusBody = {
  status?: string;
  reason?: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const sid = req.cookies.get("sid")?.value;
    const authHeader = req.headers.get("authorization");

    if (!sid && !authHeader) {
      return jsonError("missing_session_or_authorization", 401);
    }

    const body = await readJsonBody<ParentOrderStatusBody>(req);
    if (!body || typeof body.status !== "string" || body.status.trim().length === 0) {
      return jsonError("invalid_body", 400);
    }

    if (body.reason !== undefined && typeof body.reason !== "string") {
      return jsonError("invalid_body", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_CRONICOS");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const headers: HeadersInit = authHeader
      ? { Authorization: authHeader }
      : { Cookie: `sid=${sid}` };

    const result = await fetchUpstream({
      url: `${base}/order-cycles/parent-orders/${orderId}/status`,
      method: "POST",
      headers,
      body,
      redirect: "manual",
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data ?? { ok: true }, { status: result.status === 204 ? 200 : result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500);
  }
}