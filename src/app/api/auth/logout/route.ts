import { NextRequest, NextResponse } from "next/server";
import { getRequiredBaseUrl, jsonError } from "@/app/api/_lib/proxy";

type CookieOptions = {
  path?: string;
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

const parseSetCookieHeader = (
  cookieHeader: string,
  isSecureContext: boolean,
) => {
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

const clearCookie = (response: NextResponse, name: string) => {
  response.cookies.set({
    name,
    value: "",
    expires: new Date(0),
    path: "/",
  });
};

const clearLegacyCookies = (response: NextResponse) => {
  clearCookie(response, "sid");
  clearCookie(response, "trusted_device_token");
  clearCookie(response, "fsa_access_token");
  clearCookie(response, "fsa_access_token_expires_at");
  clearCookie(response, "fsa_refresh_token");
  clearCookie(response, "fsa_refresh_token_expires_at");
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
    const isSecureContext = req.nextUrl.protocol === "https:";

    const setCookieHeaders = getSetCookieHeaders(upstream.headers);

    for (const cookieHeader of setCookieHeaders) {
      const parsedCookie = parseSetCookieHeader(cookieHeader, isSecureContext);

      if (!parsedCookie) {
        continue;
      }

      parsedCookie.options.path = "/";
      response.cookies.set(
        parsedCookie.name,
        parsedCookie.value,
        parsedCookie.options,
      );
    }

    clearLegacyCookies(response);

    return response;
  } catch {
    return jsonError("proxy_failure", 503);
  }
}