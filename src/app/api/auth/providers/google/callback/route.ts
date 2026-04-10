import { NextRequest, NextResponse } from "next/server";
import { getRequiredBaseUrl } from "@/app/api/_lib/proxy";
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
const GOOGLE_AUTH_ERROR_QUERY = "googleAuthError";
const DEFAULT_POPUP_ERROR = "AUTH_GOOGLE_FAILED";

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

const getCallbackRedirectResponse = (req: NextRequest, hasError: boolean) => {
  const redirectCookie = req.cookies.get(SOCIAL_REDIRECT_COOKIE)?.value;
  const redirectPath = getSafeRedirectPath(redirectCookie ?? "/home");
  const redirectUrl = new URL(hasError ? "/" : redirectPath, req.url);

  if (hasError) {
    redirectUrl.searchParams.set(GOOGLE_AUTH_ERROR_QUERY, "1");
  }

  return NextResponse.redirect(redirectUrl);
};

const getPopupErrorCode = (req: NextRequest) => {
  return (
    req.nextUrl.searchParams.get("error") ||
    req.nextUrl.searchParams.get("error_code") ||
    DEFAULT_POPUP_ERROR
  );
};

const getPopupResponse = (req: NextRequest, payload: { type: "SOCIAL_AUTH_SUCCESS" } | { type: "SOCIAL_AUTH_ERROR"; error: string }) => {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Google login</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script>
      (function () {
        var payload = ${JSON.stringify(payload)};
        var targetOrigin = ${JSON.stringify(req.nextUrl.origin)};

        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, targetOrigin);
          }
        } finally {
          window.close();
        }
      })();
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};

export async function GET(req: NextRequest) {
  try {
    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
    const isPopupMode = req.cookies.get(SOCIAL_POPUP_COOKIE)?.value === "1";

    if (!base) {
      if (isPopupMode) {
        const response = getPopupResponse(req, {
          type: "SOCIAL_AUTH_ERROR",
          error: DEFAULT_POPUP_ERROR,
        });
        response.cookies.delete(SOCIAL_REDIRECT_COOKIE);
        response.cookies.delete(SOCIAL_POPUP_COOKIE);
        return response;
      }

      return NextResponse.redirect(new URL(`/?${GOOGLE_AUTH_ERROR_QUERY}=1`, req.url));
    }

    const upstreamUrl = new URL(`${base}/providers/google/callback`);
    req.nextUrl.searchParams.forEach((value, key) => {
      upstreamUrl.searchParams.set(key, value);
    });

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

    const hasError = upstream.status >= 400;
    const response = isPopupMode
      ? getPopupResponse(
          req,
          hasError
            ? {
                type: "SOCIAL_AUTH_ERROR",
                error: getPopupErrorCode(req),
              }
            : { type: "SOCIAL_AUTH_SUCCESS" },
        )
      : getCallbackRedirectResponse(req, hasError);
    const isSecureContext = req.nextUrl.protocol === "https:";

    for (const cookie of getSetCookieHeaders(upstream.headers)) {
      const parsedCookie = parseSetCookieHeader(cookie, isSecureContext);

      if (!parsedCookie) {
        continue;
      }

      response.cookies.set(parsedCookie.name, parsedCookie.value, parsedCookie.options);
    }

    response.cookies.delete(SOCIAL_REDIRECT_COOKIE);
    response.cookies.delete(SOCIAL_POPUP_COOKIE);
    return response;
  } catch {
    if (req.cookies.get(SOCIAL_POPUP_COOKIE)?.value === "1") {
      const response = getPopupResponse(req, {
        type: "SOCIAL_AUTH_ERROR",
        error: DEFAULT_POPUP_ERROR,
      });
      response.cookies.delete(SOCIAL_REDIRECT_COOKIE);
      response.cookies.delete(SOCIAL_POPUP_COOKIE);
      return response;
    }

    return NextResponse.redirect(new URL(`/?${GOOGLE_AUTH_ERROR_QUERY}=1`, req.url));
  }
}