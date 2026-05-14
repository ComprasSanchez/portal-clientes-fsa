import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  fetchUpstream,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";

type OnboardingStartBody = {
  account?: {
    username?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  };
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

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<OnboardingStartBody>(req);

    if (
      !body ||
      !isNonEmptyString(body.account?.username) ||
      !isNonEmptyString(body.account?.email) ||
      !isNonEmptyString(body.account?.password) ||
      !isNonEmptyString(body.customerIdentity?.tipoDocumento) ||
      !isNonEmptyString(body.customerIdentity?.nroDocumento) ||
      !isNonEmptyString(body.customerIdentity?.nombre) ||
      !isNonEmptyString(body.customerIdentity?.apellido)
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
      url: `${base}/onboarding/start`,
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
