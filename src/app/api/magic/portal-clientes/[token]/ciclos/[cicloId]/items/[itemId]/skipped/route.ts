import { NextRequest, NextResponse } from "next/server";
import { fetchUpstream, getRequiredBaseUrl, jsonError } from "@/app/api/_lib/proxy";

export async function PATCH(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string; cicloId: string; itemId: string }> },
) {
  try {
    const { token, cicloId, itemId } = await ctx.params;

    if (!token || !cicloId || !itemId) {
      return jsonError("missing_parameters", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_CRONICOS_PORTAL");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const result = await fetchUpstream({
      url: `${base}/magic/portal-cliente/${token}/ciclos/${cicloId}/items/${itemId}/skipped`,
      method: "PATCH",
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data ?? { ok: true }, { status: 200 });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}