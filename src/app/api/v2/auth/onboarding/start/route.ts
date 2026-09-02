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
    first_name?: string;
    last_name?: string;
  };
  customer_identity?: {
    tipo_documento?: string;
    nro_documento?: string;
    nombre?: string;
    apellido?: string;
    sexo?: string;
    fecha_nacimiento?: string;
    telefono?: string;
  };
  account_kind?: string;
  external_system?: string;
  external_ref?: string;
  canal?: string;
  sucursal_codigo?: string;
  convenio?: string;
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
      !isNonEmptyString(body.customer_identity?.tipo_documento) ||
      !isNonEmptyString(body.customer_identity?.nro_documento) ||
      !isNonEmptyString(body.customer_identity?.nombre) ||
      !isNonEmptyString(body.customer_identity?.apellido)
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
