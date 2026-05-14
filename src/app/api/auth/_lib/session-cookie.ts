import { NextRequest, NextResponse } from "next/server";

type CookieOptions = {
  path?: string;
  domain?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  expires?: Date;
  maxAge?: number;
};

type ParsedCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

export const SESSION_EXPIRY_COOKIE_NAME = "sid_expires_at";

const splitCombinedSetCookieHeader = (setCookieHeader: string) => {
  return setCookieHeader
    .split(/,(?=[^;=]+=[^;]+)/g)
    .map((value) => value.trim())
    .filter(Boolean);
};

export const getSetCookieHeaders = (headers: Headers) => {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof withGetSetCookie.getSetCookie === "function") {
    return withGetSetCookie.getSetCookie();
  }

  const setCookieHeader = headers.get("set-cookie");
  return setCookieHeader ? splitCombinedSetCookieHeader(setCookieHeader) : [];
};

export const parseSetCookieHeader = (
  cookieHeader: string,
  isSecureContext: boolean,
): ParsedCookie | null => {
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

const clearSessionExpiryCookie = (response: NextResponse, domain?: string) => {
  response.cookies.set({
    name: SESSION_EXPIRY_COOKIE_NAME,
    value: "",
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    ...(domain ? { domain } : {}),
  });
};

const resolveCookieExpiry = (options: CookieOptions) => {
  if (options.expires) {
    return options.expires;
  }

  if (typeof options.maxAge === "number" && Number.isFinite(options.maxAge)) {
    return new Date(Date.now() + options.maxAge * 1000);
  }

  return null;
};

const syncSessionExpiryCookie = (response: NextResponse, parsedCookie: ParsedCookie) => {
  if (parsedCookie.name !== "sid") {
    return;
  }

  const expiresAt = resolveCookieExpiry(parsedCookie.options);
  const shouldClear =
    !parsedCookie.value ||
    (typeof parsedCookie.options.maxAge === "number" && parsedCookie.options.maxAge <= 0) ||
    (expiresAt ? expiresAt.getTime() <= Date.now() : false);

  if (shouldClear || !expiresAt) {
    clearSessionExpiryCookie(response, parsedCookie.options.domain);
    return;
  }

  response.cookies.set({
    name: SESSION_EXPIRY_COOKIE_NAME,
    value: String(expiresAt.getTime()),
    path: parsedCookie.options.path ?? "/",
    httpOnly: true,
    sameSite: parsedCookie.options.sameSite ?? "lax",
    ...(parsedCookie.options.secure ? { secure: true } : {}),
    ...(parsedCookie.options.domain ? { domain: parsedCookie.options.domain } : {}),
    ...(parsedCookie.options.expires ? { expires: parsedCookie.options.expires } : {}),
    ...(typeof parsedCookie.options.maxAge === "number"
      ? { maxAge: parsedCookie.options.maxAge }
      : {}),
  });
};

export const applyAuthCookiesFromUpstream = (
  req: NextRequest,
  response: NextResponse,
  upstreamHeaders: Headers,
) => {
  const isSecureContext = req.nextUrl.protocol === "https:";
  const setCookieHeaders = getSetCookieHeaders(upstreamHeaders);

  for (const cookieHeader of setCookieHeaders) {
    const parsedCookie = parseSetCookieHeader(cookieHeader, isSecureContext);

    if (!parsedCookie) {
      continue;
    }

    parsedCookie.options.path = parsedCookie.options.path || "/";
    response.cookies.set(parsedCookie.name, parsedCookie.value, parsedCookie.options);
    syncSessionExpiryCookie(response, parsedCookie);
  }
};

export const clearSessionExpiryMetadata = (
  response: NextResponse,
  domain?: string,
) => {
  clearSessionExpiryCookie(response, domain);
};