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

    const cookieHeader = req.headers.get("cookie");
    const upstream = await fetch(`${base}/providers/google/start`, {
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

    const response = new NextResponse(null, {
      status: upstream.status,
      headers: {
        Location: location,
      },
    });
    const isSecureContext = req.nextUrl.protocol === "https:";

    for (const cookie of getSetCookieHeaders(upstream.headers)) {
      const parsedCookie = parseSetCookieHeader(cookie, isSecureContext);

      if (!parsedCookie) {
        continue;
      }

      response.cookies.set(parsedCookie.name, parsedCookie.value, parsedCookie.options);
    }

    const redirectTo = getSafeRedirectPath(req.nextUrl.searchParams.get("redirectTo"));
    response.cookies.set(SOCIAL_REDIRECT_COOKIE, redirectTo, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: isSecureContext,
      maxAge: 60 * 10,
    });

    return response;
  } catch {
    return jsonError("proxy_failure", 500);
  }
}