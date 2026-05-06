import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";

type IdentityLinkStartBody = {
  accountKind?: string;
  externalSystem?: string;
  externalRef?: string;
  tipoDocumento?: string;
  nroDocumento?: string;
  nombre?: string;
  apellido?: string;
  sexo?: string;
  fechaNacimiento?: string;
  phoneE164?: string;
  email?: string;
  emailVerified?: boolean;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<IdentityLinkStartBody>(req);

    if (
      !body ||
      !isNonEmptyString(body.tipoDocumento) ||
      !isNonEmptyString(body.nroDocumento) ||
      !isNonEmptyString(body.nombre) ||
      !isNonEmptyString(body.apellido)
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
      url: `${base}/identity-link/start`,
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
