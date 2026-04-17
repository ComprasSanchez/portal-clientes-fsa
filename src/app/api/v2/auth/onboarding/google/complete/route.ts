import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";

type GoogleCompleteBody = {
  customerIdentity?: {
    tipoDocumento?: string;
    nroDocumento?: string;
    nombre?: string;
    apellido?: string;
    sexo?: string;
    fechaNacimiento?: string;
    telefono?: string;
  };
  accountKind?: string;
  externalSystem?: string;
  externalRef?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<GoogleCompleteBody>(req);

    if (
      !body ||
      typeof body.customerIdentity?.tipoDocumento !== "string" ||
      typeof body.customerIdentity?.nroDocumento !== "string" ||
      typeof body.customerIdentity?.nombre !== "string" ||
      typeof body.customerIdentity?.apellido !== "string" ||
      typeof body.customerIdentity?.sexo !== "string" ||
      typeof body.customerIdentity?.fechaNacimiento !== "string" ||
      typeof body.customerIdentity?.telefono !== "string"
    ) {
      return jsonError("invalid_body", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const headers: HeadersInit = {
      "x-request-id": requestId,
      ...(authorization ? { Authorization: authorization } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    };

    const result = await fetchUpstream<unknown>({
      url: `${base}/onboarding/google/complete`,
      method: "POST",
      headers,
      body,
    });

    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data ?? { ok: true }, { status: result.status });
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}