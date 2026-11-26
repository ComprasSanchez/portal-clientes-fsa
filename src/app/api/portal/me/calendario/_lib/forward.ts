import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Proxy del calendario de fin de año hacia bff-cliente-web (que llama a eventos-back). */
export async function forwardCalendario(
  req: NextRequest,
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  raiz = "/portal/me/calendario",
) {
  try {
    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_SOCIOSA");
    if (!base) return jsonError("missing_upstream_base", 500);

    let body: Record<string, unknown> | undefined;
    if (method === "POST" || method === "PUT") {
      const parsed = await readJsonBody<Record<string, unknown>>(req);
      body = parsed && typeof parsed === "object" ? parsed : {};
    }

    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const headers: HeadersInit = {
      "x-request-id": requestId,
      ...(authorization ? { Authorization: authorization } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    };

    const result = await fetchUpstream<unknown>({
      url: `${base}${raiz}${path}`,
      method,
      headers,
      body,
    });
    if (!result.ok) return result.response;
    if (result.status === 204) return new NextResponse(null, { status: 204 });
    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}

/** Valida la fecha del path antes de reenviarla. */
export const fechaValida = (fecha: string) => FECHA_RE.test(fecha);
