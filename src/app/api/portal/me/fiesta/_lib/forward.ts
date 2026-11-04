import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";

/** Proxy común de la fiesta de fin de año de colaboradores (temporal). */
export async function forwardFiesta(
  req: NextRequest,
  path: "" | "/asistencia",
  method: "GET" | "POST",
) {
  try {
    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_SOCIOSA");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    let body: Record<string, unknown> | undefined;
    if (method === "POST") {
      const parsed = await readJsonBody<Record<string, unknown>>(req);
      if (!parsed || typeof parsed !== "object") {
        return jsonError("invalid_body", 400);
      }
      body = parsed;
    }

    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const headers: HeadersInit = {
      "x-request-id": requestId,
      ...(authorization ? { Authorization: authorization } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    };

    const result = await fetchUpstream<unknown>({
      url: `${base}/portal/me/fiesta${path}`,
      method,
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
