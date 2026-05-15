import { NextRequest, NextResponse } from "next/server";
import { getRequiredBaseUrl, jsonError } from "@/app/api/_lib/proxy";
import { SESSION_EXPIRY_COOKIE_NAME, clearSessionExpiryMetadata } from "@/app/api/auth/_lib/session-cookie";

type CookieOptions = {
  path?: string;
  domain?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  expires?: Date;
  maxAge?: number;
};

const splitCombinedSetCookieHeader = (setCookieHeader: string) => {
  return setCookieHeader
    .split(/,(?=[^;=]+=[^;]+)/g)
    .map((value) => value.trim())
    .filter(Boolean);
};

const getSetCookieHeaders = (headers: Headers) => {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof withGetSetCookie.getSetCookie === "function") {
    return withGetSetCookie.getSetCookie();
  }

  const setCookieHeader = headers.get("set-cookie");
  return setCookieHeader ? splitCombinedSetCookieHeader(setCookieHeader) : [];
};

const parseSetCookieHeader = (cookieHeader: string) => {
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
      case "domain":
        if (parsedValue) {
          options.domain = parsedValue;
        }
        break;
      case "httponly":
        options.httpOnly = true;
        break;
      case "secure":
        hasSecureAttribute = true;
        break;
      case "samesite": {
        const sameSite = parsedValue.toLowerCase();
        if (
          sameSite === "lax" ||
          sameSite === "strict" ||
          sameSite === "none"
        ) {
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
    options.secure = true;
  }

  return {
    name,
    value,
    options,
  };
};

const resolveParentCookieDomain = (req: NextRequest) => {
  const configuredDomain = process.env.COOKIE_DOMAIN?.trim();
  if (configuredDomain) {
    return configuredDomain.startsWith(".")
      ? configuredDomain
      : `.${configuredDomain}`;
  }

  const host = req.headers.get("host")?.split(":")[0]?.trim().toLowerCase();
  if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null;
  }

  const segments = host.split(".").filter(Boolean);
  if (segments.length < 3) {
    return null;
  }

  return `.${segments.slice(1).join(".")}`;
};

const buildUpstreamErrorResponse = async (upstream: Response) => {
  const contentType = upstream.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await upstream.json().catch(() => null);
    return NextResponse.json(
      data ?? { ok: false, error: "upstream_error" },
      {
        status: upstream.status,
      },
    );
  }

  const text = await upstream.text().catch(() => "upstream_error");
  return jsonError(text || "upstream_error", upstream.status);
};

const clearCookie = (
  response: NextResponse,
  name: string,
  domain?: string,
) => {
  response.cookies.set({
    name,
    value: "",
    expires: new Date(0),
    path: "/",
    ...(domain ? { domain } : {}),
  });
};

const clearLegacyCookies = (response: NextResponse, req: NextRequest) => {
  const parentDomain = resolveParentCookieDomain(req);

  clearCookie(response, "sid");
  clearCookie(response, SESSION_EXPIRY_COOKIE_NAME);
  clearCookie(response, "trusted_device_token");
  clearCookie(response, "fsa_access_token");
  clearCookie(response, "fsa_access_token_expires_at");
  clearCookie(response, "fsa_refresh_token");
  clearCookie(response, "fsa_refresh_token_expires_at");

  if (parentDomain) {
    clearCookie(response, "sid", parentDomain);
    clearCookie(response, SESSION_EXPIRY_COOKIE_NAME, parentDomain);
    clearCookie(response, "trusted_device_token", parentDomain);
    clearCookie(response, "fsa_access_token", parentDomain);
    clearCookie(response, "fsa_access_token_expires_at", parentDomain);
    clearCookie(response, "fsa_refresh_token", parentDomain);
    clearCookie(response, "fsa_refresh_token_expires_at", parentDomain);
  }
};

export async function POST(req: NextRequest) {
  try {
    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");

    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const upstream = await fetch(`${base}/logout`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(req.headers.get("host")
          ? { "x-forwarded-host": req.headers.get("host") as string }
          : {}),
        ...(req.nextUrl.protocol
          ? {
              "x-forwarded-proto": req.nextUrl.protocol.replace(":", ""),
            }
          : {}),
        ...(req.headers.get("x-forwarded-for")
          ? {
              "x-forwarded-for": req.headers.get("x-forwarded-for") as string,
            }
          : {}),
        ...(req.headers.get("cookie")
          ? { Cookie: req.headers.get("cookie") as string }
          : {}),
      },
      cache: "no-store",
      redirect: "manual",
    });

    if (!upstream.ok) {
      return await buildUpstreamErrorResponse(upstream);
    }

    const response =
      upstream.status === 204
        ? new NextResponse(null, { status: 204 })
        : NextResponse.json(await upstream.json().catch(() => ({ ok: true })), {
            status: upstream.status,
          });
    const setCookieHeaders = getSetCookieHeaders(upstream.headers);

    for (const cookieHeader of setCookieHeaders) {
      const parsedCookie = parseSetCookieHeader(cookieHeader);

      if (!parsedCookie) {
        continue;
      }

      response.cookies.set(
        parsedCookie.name,
        parsedCookie.value,
        parsedCookie.options,
      );
    }

    clearLegacyCookies(response, req);
    clearSessionExpiryMetadata(response);

    return response;
  } catch {
    return jsonError("proxy_failure", 503);
  }
}
