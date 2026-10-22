import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";
import { EXTERNAL_HANDOFF_SYSTEMS, type ExternalHandoffSystem } from "@/lib/external-systems";

type ExternalHandoffBody = {
  external_system?: string;
};

const isHandoffSystem = (value: unknown): value is ExternalHandoffSystem =>
  typeof value === "string" &&
  EXTERNAL_HANDOFF_SYSTEMS.includes(value as ExternalHandoffSystem);

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<ExternalHandoffBody>(req);

    if (!body || !isHandoffSystem(body.external_system)) {
      return jsonError("invalid_external_system", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const result = await fetchUpstream<{ ok: true; redirect_to: string }>({
      url: `${base}/external-handoff`,
      method: "POST",
      headers: {
        "x-request-id": requestId,
        ...(authorization ? { Authorization: authorization } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: { external_system: body.external_system },
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}
