import { NextRequest, NextResponse } from "next/server";
import { getRequiredBaseUrl, jsonError } from "@/app/api/_lib/proxy";
import { getSafeRedirectPath } from "@/lib/auth";

type CookieOptions = {
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  expires?: Date;
  maxAge?: number;
};

const SOCIAL_REDIRECT_COOKIE = "social_auth_redirect";
const SOCIAL_POPUP_COOKIE = "social_auth_popup";

const getSetCookieHeaders = (headers: Headers) => {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof withGetSetCookie.getSetCookie === "function") {
    return withGetSetCookie.getSetCookie();
  }

  const setCookieHeader = headers.get("set-cookie");
  return setCookieHeader ? [setCookieHeader] : [];
};

const parseSetCookieHeader = (cookieHeader: string, isSecureContext: boolean) => {
  const [nameValue, ...attributes] = cookieHeader.split(/;\s*/);
  const separatorIndex = nameValue.indexOf("=");

  if (separatorIndex <= 0) {
    return null;
  }

  const name = nameValue.slice(0, separatorIndex).trim();
  const value = nameValue.slice(separatorIndex + 1).trim();

  if (!name) {
    return null;
  }

  const options: CookieOptions = {
    path: "/",
  };
  let hasSecureAttribute = false;

  for (const attribute of attributes) {
    const [rawKey, ...rest] = attribute.split("=");
    const key = rawKey.trim().toLowerCase();
    const parsedValue = rest.join("=").trim();

    switch (key) {
      case "path":
        options.path = parsedValue || "/";
        break;
      case "httponly":
        options.httpOnly = true;
        break;
      case "secure":
        hasSecureAttribute = true;
        break;
      case "samesite": {
        const sameSite = parsedValue.toLowerCase();
        if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
          options.sameSite = sameSite;
        }
        break;
      }
      case "expires": {
        const expires = new Date(parsedValue);
        if (!Number.isNaN(expires.getTime())) {
          options.expires = expires;
        }
        break;
      }
      case "max-age": {
        const maxAge = Number(parsedValue);
        if (Number.isFinite(maxAge)) {
          options.maxAge = maxAge;
        }
        break;
      }
      default:
        break;
    }
  }

  if (hasSecureAttribute) {
    options.secure = isSecureContext;
  }

  if (!isSecureContext && options.sameSite === "none") {
    options.sameSite = "lax";
  }

  return {
    name,
    value,
    options,
  };
};

export async function GET(req: NextRequest) {
  try {
    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const upstreamUrl = new URL(`${base}/providers/google/start`);
    const mode = req.nextUrl.searchParams.get("mode");

    if (mode) {
      upstreamUrl.searchParams.set("mode", mode);
    }

    const cookieHeader = req.headers.get("cookie");
    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        "x-forwarded-host": req.headers.get("host") ?? req.nextUrl.host,
        "x-forwarded-proto": req.nextUrl.protocol.replace(":", ""),
        "x-forwarded-port": req.nextUrl.port || (req.nextUrl.protocol === "https:" ? "443" : "80"),
      },
      cache: "no-store",
      redirect: "manual",
    });

    const location = upstream.headers.get("location");

    if (!location) {
      return jsonError("missing_redirect_location", 502);
    }

    const callbackUrl =
      process.env.FSA_AUTH_GOOGLE_REDIRECT_URI?.trim() ||
      `${req.nextUrl.origin}/api/auth/providers/google/callback`;
    let proxiedLocation = location;

    try {
      const redirectUrl = new URL(location);
      if (redirectUrl.searchParams.has("redirect_uri")) {
        console.log("[GOOGLE_START] Original redirect_uri:", redirectUrl.searchParams.get("redirect_uri"));
        redirectUrl.searchParams.set("redirect_uri", callbackUrl);
        console.log("[GOOGLE_START] Rewritten redirect_uri:", callbackUrl);
        proxiedLocation = redirectUrl.toString();
      }
    } catch {
      // Keep original location when URL cannot be parsed.
    }

    const response = new NextResponse(null, {
      status: upstream.status,
      headers: {
        Location: proxiedLocation,
      },
    });
    const isSecureContext = req.nextUrl.protocol === "https:";

    const setCookieHeaders = getSetCookieHeaders(upstream.headers);
    console.log("[GOOGLE_START] Set-Cookie headers from backend:", setCookieHeaders);

    for (const cookieHeader of setCookieHeaders) {
      const parsedCookie = parseSetCookieHeader(cookieHeader, isSecureContext);

      if (!parsedCookie) {
        console.log("[GOOGLE_START] Failed to parse cookie header:", cookieHeader);
        continue;
      }

      parsedCookie.options.path = "/";
      console.log("[GOOGLE_START] Setting cookie:", parsedCookie.name, "with options:", parsedCookie.options);

      response.cookies.set(parsedCookie.name, parsedCookie.value, parsedCookie.options);
    }

    const redirectTo = getSafeRedirectPath(req.nextUrl.searchParams.get("redirectTo"));
    const isPopupMode = req.nextUrl.searchParams.get("mode") === "popup";

    response.cookies.set(SOCIAL_REDIRECT_COOKIE, redirectTo, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: isSecureContext,
      maxAge: 60 * 10,
    });

    if (isPopupMode) {
      response.cookies.set(SOCIAL_POPUP_COOKIE, "1", {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: isSecureContext,
        maxAge: 60 * 10,
      });
    } else {
      response.cookies.delete(SOCIAL_POPUP_COOKIE);
    }

    return response;
  } catch {
    return jsonError("proxy_failure", 500);
  }
}
