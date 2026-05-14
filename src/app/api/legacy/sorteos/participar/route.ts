import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";

type ParticiparBody = {
  documento?: string;
  canal?: string;
  sucursalCodigo?: string;
  sorteo?: unknown;
};

const getLegacyBaseUrl = () => getRequiredBaseUrl("CRM_WEBSERVICE_BASE_URL") ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<ParticiparBody>(req);
    const documento = body?.documento?.trim();

    if (!documento) {
      return jsonError("documento_requerido", 400);
    }

    const base = getLegacyBaseUrl();
    const { requestId } = buildForwardHeaders(req);

    const result = await fetchUpstream<unknown>({
      url: `${base}/sorteos/participar`,
      method: "POST",
      headers: {
        "x-request-id": requestId,
      },
      body: {
        documento,
        canal: body?.canal,
        sucursalCodigo: body?.sucursalCodigo,
        sorteo: body?.sorteo,
      },
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data ?? { ok: true }, { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}
