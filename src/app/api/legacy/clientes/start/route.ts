import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";

type StartBody = {
  Documento?: string;
  Nombre?: string;
  Apellido?: string;
  Telefono?: string;
  Email?: string;
  convenio?: string;
  canal?: string;
  aceptaTerminos?: boolean;
};

const getLegacyBaseUrl = () =>
  getRequiredBaseUrl("CRM_WEBSERVICE_BASE_URL") ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<StartBody>(req);
    const documento = body?.Documento?.trim();

    if (!documento) {
      return jsonError("documento_requerido", 400);
    }

    const base = getLegacyBaseUrl();
    const { requestId } = buildForwardHeaders(req);

    const result = await fetchUpstream<unknown>({
      url: `${base}/clientes/start`,
      method: "POST",
      headers: { "x-request-id": requestId },
      body: {
        Documento: documento,
        Nombre: body?.Nombre,
        Apellido: body?.Apellido,
        Telefono: body?.Telefono,
        Email: body?.Email,
        convenio: body?.convenio,
        canal: body?.canal,
        aceptaTerminos: body?.aceptaTerminos,
      },
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data ?? { ok: true }, {
      status: result.status,
    });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}
