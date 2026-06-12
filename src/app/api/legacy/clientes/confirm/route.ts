import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";

type ConfirmBody = {
  pending_id?: number;
  codigo?: string;
};

const getLegacyBaseUrl = () =>
  getRequiredBaseUrl("CRM_WEBSERVICE_BASE_URL") ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<ConfirmBody>(req);

    if (!body?.pending_id || !body?.codigo?.trim()) {
      return jsonError("params_requeridos", 400);
    }

    const base = getLegacyBaseUrl();
    const { requestId } = buildForwardHeaders(req);

    const result = await fetchUpstream<unknown>({
      url: `${base}/clientes/confirm`,
      method: "POST",
      headers: { "x-request-id": requestId },
      body: {
        pending_id: body.pending_id,
        codigo: body.codigo.trim(),
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
