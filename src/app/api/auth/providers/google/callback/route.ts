import { NextRequest, NextResponse } from "next/server";
import { getRequiredBaseUrl, jsonError } from "@/app/api/_lib/proxy";
import {
  applyAuthCookiesFromUpstream,
} from "@/app/api/auth/_lib/session-cookie";
const GOOGLE_AUTH_FLOW_MODE_COOKIE = "google_auth_flow_mode";
const GOOGLE_AUTH_REDIRECT_TARGET_COOKIE = "google_auth_redirect_target";

const clearGoogleFlowCookies = (response: NextResponse) => {
  response.cookies.set({
    name: GOOGLE_AUTH_FLOW_MODE_COOKIE,
    value: "",
    path: "/",
    expires: new Date(0),
  });
  response.cookies.set({
    name: GOOGLE_AUTH_REDIRECT_TARGET_COOKIE,
    value: "",
    path: "/",
    expires: new Date(0),
  });
};

export async function GET(req: NextRequest) {
  try {
    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");

    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const upstreamUrl = new URL(`${base}/providers/google/callback`);
    req.nextUrl.searchParams.forEach((value, key) => {
      upstreamUrl.searchParams.set(key, value);
    });

    const cookieHeader = req.headers.get("cookie");
    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        "x-forwarded-host": req.headers.get("host") ?? req.nextUrl.host,
        "x-forwarded-proto": req.nextUrl.protocol.replace(":", ""),
        "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
      redirect: "manual",
    });

    const body = await upstream.arrayBuffer();
    const response = new NextResponse(body, { status: upstream.status });

    for (const [key, value] of upstream.headers.entries()) {
      const lower = key.toLowerCase();
      if (lower === "set-cookie" || lower === "transfer-encoding") continue;
      response.headers.set(key, value);
    }

    applyAuthCookiesFromUpstream(req, response, upstream.headers);

    const flowMode = req.cookies.get(GOOGLE_AUTH_FLOW_MODE_COOKIE)?.value ?? "popup";
    const redirectTarget =
      req.cookies.get(GOOGLE_AUTH_REDIRECT_TARGET_COOKIE)?.value || "/socios";
    const hasSidCookie = response.cookies.has("sid");

    if (flowMode !== "popup" && hasSidCookie) {
      const redirectUrl = new URL(
        redirectTarget.startsWith("/") ? redirectTarget : "/socios",
        req.url,
      );
      const redirectResponse = NextResponse.redirect(redirectUrl, 302);

      for (const cookie of response.cookies.getAll()) {
        redirectResponse.cookies.set(cookie);
      }

      clearGoogleFlowCookies(redirectResponse);

      return redirectResponse;
    }

    if (flowMode !== "popup") {
      let errorCode = "AUTH_SOCIAL_CALLBACK_FAILED";

      try {
        const text = new TextDecoder().decode(body);
        const json = JSON.parse(text) as Record<string, unknown>;
        const err = json.error;

        if (typeof err === "object" && err !== null && "code" in err) {
          errorCode = String((err as Record<string, unknown>).code);
        } else if (typeof err === "string" && err.length > 0) {
          errorCode = err;
        }
      } catch {
        // el BFF puede devolver HTML de Keycloak en caso de error federado
      }

      const loginUrl = new URL("/", req.url);
      loginUrl.searchParams.set("googleAuthError", errorCode);
      const errorRedirect = NextResponse.redirect(loginUrl, 302);
      clearGoogleFlowCookies(errorRedirect);
      return errorRedirect;
    }

    return response;
  } catch {
    return jsonError("proxy_failure", 500);
  }
}
