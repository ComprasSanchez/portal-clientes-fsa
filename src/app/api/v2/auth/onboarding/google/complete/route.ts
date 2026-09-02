import { NextRequest, NextResponse } from "next/server";
import { buildForwardHeaders, getRequiredBaseUrl, jsonError, readJsonBody } from "@/app/api/_lib/proxy";

type GoogleCompleteBody = {
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
};

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<GoogleCompleteBody>(req);

    if (
      !body ||
      typeof body.customer_identity?.tipo_documento !== "string" ||
      typeof body.customer_identity?.nro_documento !== "string" ||
      typeof body.customer_identity?.nombre !== "string" ||
      typeof body.customer_identity?.apellido !== "string" ||
      typeof body.customer_identity?.sexo !== "string" ||
      typeof body.customer_identity?.fecha_nacimiento !== "string" ||
      typeof body.customer_identity?.telefono !== "string"
    ) {
      return jsonError("invalid_body", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const upstream = await fetch(`${base}/onboarding/google/complete`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(authorization ? { Authorization: authorization } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
      redirect: "manual",
    });

    const response = new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
    });

    for (const [key, value] of upstream.headers.entries()) {
      const lower = key.toLowerCase();
      if (lower === "set-cookie" || lower === "transfer-encoding") {
        continue;
      }

      response.headers.set(key, value);
    }

    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) {
      response.headers.append("set-cookie", setCookie);
    }

    return response;
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}