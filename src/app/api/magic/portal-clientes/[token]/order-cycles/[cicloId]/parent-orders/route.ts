import { NextRequest, NextResponse } from "next/server";
import { fetchUpstream, getRequiredBaseUrl, jsonError } from "@/app/api/_lib/proxy";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string; cicloId: string }> },
) {
  try {
    const { token, cicloId } = await ctx.params;

    if (!token || !cicloId) {
      return jsonError("missing_token_or_cicloId", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_CRONICOS_PORTAL");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const result = await fetchUpstream<unknown[]>({
      url: `${base}/magic/portal-cliente/${token}/order-cycles/${cicloId}/parent-orders`,
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data ?? [], { status: 200 });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}