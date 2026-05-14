import { NextRequest, NextResponse } from "next/server";
import {
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  withQueryParams,
} from "@/app/api/_lib/proxy";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await ctx.params;

    if (!token) {
      return jsonError("missing_token", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_CRONICOS_PORTAL");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const result = await fetchUpstream({
      url: withQueryParams(req, `${base}/magic/portal-cliente/${token}/sucursales/search`),
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    return jsonError("internal_error", 500, String(error));
  }
}