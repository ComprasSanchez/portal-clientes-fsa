import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  getRequiredBaseUrl,
  jsonError,
} from "@/app/api/_lib/proxy";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ expedienteId: string }> },
) {
  try {
    const { expedienteId } = await ctx.params;
    if (!expedienteId) {
      return jsonError("missing_expediente_id", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_SOCIOSA");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const incoming = await req.formData().catch(() => null);
    if (!incoming) {
      return jsonError("invalid_body", 400);
    }

    const file = incoming.get("file");
    if (!(file instanceof Blob)) {
      return jsonError("missing_file", 400);
    }

    // Reconstruir el FormData en vez de reenviar el objeto parseado tal cual
    // (más robusto ante Route Handlers de Next.js reenviando archivos).
    const fileBuffer = await file.arrayBuffer();
    const outgoing = new FormData();
    outgoing.append(
      "file",
      new Blob([fileBuffer], { type: file.type }),
      file instanceof File ? file.name : "receta",
    );

    const clienteId = incoming.get("clienteId");
    if (typeof clienteId === "string") {
      outgoing.append("clienteId", clienteId);
    }

    const { authorization, cookie, requestId } = buildForwardHeaders(req);

    let upstream: Response;
    try {
      upstream = await fetch(
        `${base}/portal/me/expedientes/${expedienteId}/recetas`,
        {
          method: "POST",
          headers: {
            "x-request-id": requestId,
            ...(authorization ? { Authorization: authorization } : {}),
            ...(cookie ? { Cookie: cookie } : {}),
          },
          body: outgoing,
          cache: "no-store",
          // @ts-expect-error -- duplex es necesario en runtimes Node recientes cuando el body es un stream/FormData con archivos
          duplex: "half",
        },
      );
    } catch (error) {
      return jsonError("proxy_failure", 500, String(error));
    }

    const contentType = upstream.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await upstream.json().catch(() => null);
      return NextResponse.json(data, { status: upstream.status });
    }

    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { ok: upstream.ok, status: upstream.status, raw: text || null },
      { status: upstream.status },
    );
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}
