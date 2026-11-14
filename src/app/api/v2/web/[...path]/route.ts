import { NextRequest, NextResponse } from "next/server";
import {
  buildForwardHeaders,
  getRequiredBaseUrl,
  jsonError,
  readJsonBody,
} from "@/app/api/_lib/proxy";
import { applyAuthCookiesFromUpstream } from "@/app/api/auth/_lib/session-cookie";

// Login y registro del portal nuevo: proxy a /api/v2/web/* del gateway. Reenvía
// la cookie de sesión en las dos direcciones. Solo estas rutas.
const ALLOWED: Record<string, ReadonlyArray<"GET" | "POST">> = {
  "auth/login/lookup": ["POST"],
  "auth/login": ["POST"],
  "auth/mfa/verify": ["POST"],
  "auth/mfa/resend": ["POST"],
  "auth/login/email-code": ["POST"],
  "auth/login/email-code/verify": ["POST"],
  "auth/register": ["POST"],
  "auth/register/verify": ["POST"],
  "auth/register/resend": ["POST"],
  "me/identidad": ["GET"],
  "me/identidad/validacion": ["GET", "POST"],
  "me/identidad/validacion/codigo": ["POST"],
  "me/identidad/contacto": ["POST"],
  "me/alta": ["POST"],
};

type RouteContext = { params: Promise<{ path: string[] }> };

/** NEXT_PUBLIC_FSA_AUTH apunta a `<gateway>/api/v2/auth`; los endpoints web viven en `<gateway>/api/v2/web`. */
const webBaseUrl = () => {
  const authBase = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
  return authBase ? authBase.replace(/\/auth\/?$/, "/web") : null;
};

async function forward(req: NextRequest, ctx: RouteContext, method: "GET" | "POST") {
  try {
    const { path } = await ctx.params;
    const key = path.join("/");
    if (!ALLOWED[key]?.includes(method)) {
      return jsonError("not_found", 404);
    }

    const base = webBaseUrl();
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    let body: string | undefined;
    if (method === "POST") {
      const parsed = await readJsonBody<Record<string, unknown>>(req);
      body = JSON.stringify(parsed ?? {});
    }

    const { cookie, requestId } = buildForwardHeaders(req);
    const upstream = await fetch(`${base}/${key}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        "x-request-id": requestId,
        "user-agent": req.headers.get("user-agent") ?? "",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body,
      cache: "no-store",
      redirect: "manual",
    });

    const data: unknown = await upstream.json().catch(() => null);
    const response = NextResponse.json(data ?? { ok: upstream.ok }, {
      status: upstream.status,
    });
    if (upstream.ok) {
      applyAuthCookiesFromUpstream(req, response, upstream.headers);
    }
    return response;
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  return forward(req, ctx, "GET");
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  return forward(req, ctx, "POST");
}
