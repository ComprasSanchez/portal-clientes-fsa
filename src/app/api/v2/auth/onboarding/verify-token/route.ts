import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";
import { applyAuthCookiesFromUpstream } from "@/app/api/auth/_lib/session-cookie";

type VerifyTokenBody = {
  token?: string;
};

type UpstreamResult<T> =
  | {
      ok: true;
      status: number;
      data: T | null;
      headers: Headers;
    }
  | {
      ok: false;
      status: number;
      data: unknown | null;
      text: string | null;
      headers: Headers;
    };

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const buildUpstreamErrorResponse = (result: Extract<UpstreamResult<unknown>, { ok: false }>) => {
  if (result.data !== null) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return jsonError(result.text || "upstream_error", result.status);
};

const buildSuccessJsonResponse = (
  req: NextRequest,
  result: Extract<UpstreamResult<unknown>, { ok: true }>,
) => {
  const response = NextResponse.json(result.data ?? { ok: true }, { status: result.status });
  applyAuthCookiesFromUpstream(req, response, result.headers);
  return response;
};

const verifyTokenUpstream = async (
  req: NextRequest,
  token: string,
): Promise<UpstreamResult<unknown>> => {
  const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
  if (!base) {
    throw new Error("missing_upstream_base");
  }

  const { authorization, cookie, requestId } = buildForwardHeaders(req);
  const upstream = await fetch(`${base}/onboarding/verify-token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-request-id": requestId,
      ...(authorization ? { Authorization: authorization } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({ token }),
    cache: "no-store",
    redirect: "manual",
  });

  const contentType = upstream.headers.get("content-type") || "";

  if (!upstream.ok) {
    if (contentType.includes("application/json")) {
      return {
        ok: false,
        status: upstream.status,
        data: await upstream.json().catch(() => null),
        text: null,
        headers: upstream.headers,
      };
    }

    return {
      ok: false,
      status: upstream.status,
      data: null,
      text: await upstream.text().catch(() => "upstream_error"),
      headers: upstream.headers,
    };
  }

  if (upstream.status === 204 || !contentType.includes("application/json")) {
    return {
      ok: true,
      status: upstream.status,
      data: null,
      headers: upstream.headers,
    };
  }

  return {
    ok: true,
    status: upstream.status,
    data: await upstream.json().catch(() => null),
    headers: upstream.headers,
  };
};

const buildBrowserRedirect = (req: NextRequest, params: Record<string, string>) => {
  const redirectUrl = new URL("/", req.url);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(redirectUrl);
};

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<VerifyTokenBody>(req);

    if (!isNonEmptyString(body?.token)) {
      return jsonError("invalid_body", 400);
    }

    const result = await verifyTokenUpstream(req, body.token.trim());

    if (!result.ok) {
      return buildUpstreamErrorResponse(result);
    }

    return buildSuccessJsonResponse(req, result);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_upstream_base") {
      return jsonError("missing_upstream_base", 500);
    }

    return jsonError("proxy_failure", 500, String(error));
  }
}

// Este GET es el que pega el link del mail de verificación — a propósito
// NO llama al upstream ni muta nada acá. Si lo hiciera, cualquier scanner
// de seguridad de email (Gmail Safe Browsing, Outlook Safe Links, antivirus
// corporativos) que visite el link antes del click real del usuario
// consumiría el token de un solo uso, y el usuario real nunca podría
// verificar ni recibir la cookie de trusted_device.
// Por eso solo redirige a la home con el token: la verificación real la
// hace `login.tsx` desde el navegador del usuario vía POST (ver useEffect
// de `verificationTokenFromUrl`), que es donde de verdad importa que se
// ejecute en el dispositivo/navegador que después va a hacer login.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return buildBrowserRedirect(req, {
      onboarding: "error",
      onboardingError: "AUTH_ONBOARDING_TOKEN_INVALID",
    });
  }

  return buildBrowserRedirect(req, { token });
}
