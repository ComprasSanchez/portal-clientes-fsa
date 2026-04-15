import { NextRequest, NextResponse } from "next/server";

type UpstreamSuccess<T> = {
  ok: true;
  status: number;
  data: T | null;
};

type UpstreamFailure = {
  ok: false;
  response: NextResponse;
};

type ServiceTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  refresh_token?: string;
  refresh_expires_in?: number;
};

type CachedServiceToken = {
  accessToken: string;
  expiresAt: number;
};

const SERVICE_TOKEN_REFRESH_WINDOW_MS = 60_000;
const USER_TOKEN_REFRESH_WINDOW_MS = 60_000;

const USER_ACCESS_TOKEN_COOKIE = "fsa_access_token";
const USER_ACCESS_TOKEN_EXPIRES_AT_COOKIE = "fsa_access_token_expires_at";
const USER_REFRESH_TOKEN_COOKIE = "fsa_refresh_token";
const USER_REFRESH_TOKEN_EXPIRES_AT_COOKIE = "fsa_refresh_token_expires_at";

let cachedServiceToken: CachedServiceToken | null = null;
let serviceTokenRequest: Promise<string> | null = null;

type UserTokenBundle = {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string | null;
  refreshTokenExpiresAt: number | null;
};

type ForwardAuthorizationResult = {
  authorization: string;
  refreshedUserTokens?: UserTokenBundle;
  shouldClearUserTokens?: boolean;
};

const sanitizeEnvValue = (envName: string) => {
  const rawValue = process.env[envName] || "";
  const sanitizedValue = rawValue
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\/$/, "");

  return sanitizedValue || null;
};

export const getRequiredBaseUrl = (envName: string) => {
  return sanitizeEnvValue(envName);
};

const readUpstreamErrorText = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string; message?: string; details?: string }
      | null;

    return data?.message || data?.error || data?.details || null;
  }

  return (await response.text().catch(() => "")).trim() || null;
};

const getCachedServiceAccessToken = () => {
  if (!cachedServiceToken) {
    return null;
  }

  if (Date.now() >= cachedServiceToken.expiresAt - SERVICE_TOKEN_REFRESH_WINDOW_MS) {
    cachedServiceToken = null;
    return null;
  }

  return cachedServiceToken.accessToken;
};

const readNumericCookie = (req: NextRequest, name: string) => {
  const raw = req.cookies.get(name)?.value?.trim();
  if (!raw) {
    return null;
  }

  const numericValue = Number(raw);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const readUserTokenBundle = (req: NextRequest): UserTokenBundle | null => {
  const accessToken = req.cookies.get(USER_ACCESS_TOKEN_COOKIE)?.value?.trim();
  const accessTokenExpiresAt = readNumericCookie(req, USER_ACCESS_TOKEN_EXPIRES_AT_COOKIE);
  const refreshToken = req.cookies.get(USER_REFRESH_TOKEN_COOKIE)?.value?.trim() || null;
  const refreshTokenExpiresAt = readNumericCookie(req, USER_REFRESH_TOKEN_EXPIRES_AT_COOKIE);

  if (!accessToken || !accessTokenExpiresAt) {
    return null;
  }

  return {
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
  };
};

const hasUsableToken = (expiresAt: number | null | undefined, refreshWindowMs: number) => {
  if (!expiresAt) {
    return false;
  }

  return Date.now() < expiresAt - refreshWindowMs;
};

const requestOAuthToken = async (body: URLSearchParams) => {
  const tokenUrl = sanitizeEnvValue("FSA_AUTH_TOKEN_URL");

  if (!tokenUrl) {
    throw new Error("missing_service_token_config");
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await readUpstreamErrorText(response);
    throw new Error(details || "oauth_token_request_failed");
  }

  return (await response.json()) as ServiceTokenResponse;
};

const normalizeUserTokenBundle = (data: ServiceTokenResponse): UserTokenBundle => {
  const accessToken = data.access_token?.trim();

  if (!accessToken) {
    throw new Error("missing_access_token");
  }

  const expiresInSeconds = Number(data.expires_in);
  const refreshToken = data.refresh_token?.trim() || null;
  const refreshExpiresInSeconds = Number(data.refresh_expires_in);

  return {
    accessToken,
    accessTokenExpiresAt: Number.isFinite(expiresInSeconds)
      ? Date.now() + expiresInSeconds * 1000
      : Date.now() + 5 * 60 * 1000,
    refreshToken,
    refreshTokenExpiresAt:
      refreshToken && Number.isFinite(refreshExpiresInSeconds)
        ? Date.now() + refreshExpiresInSeconds * 1000
        : null,
  };
};

export const getServiceAccessToken = async () => {
  const cachedAccessToken = getCachedServiceAccessToken();
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  if (serviceTokenRequest) {
    return serviceTokenRequest;
  }

  const username = sanitizeEnvValue("FSA_AUTH_TOKEN_USERNAME");
  const password = sanitizeEnvValue("FSA_AUTH_TOKEN_PASSWORD");

  if (!username || !password) {
    throw new Error("missing_service_token_config");
  }

  serviceTokenRequest = (async () => {
    const data = await requestOAuthToken(
      new URLSearchParams({
      grant_type: "password",
      username,
      password,
      }),
    );
    const accessToken = data.access_token?.trim();

    if (!accessToken) {
      throw new Error("missing_access_token");
    }

    const expiresInSeconds = Number(data.expires_in);
    const expiresAt = Number.isFinite(expiresInSeconds)
      ? Date.now() + expiresInSeconds * 1000
      : Date.now() + 5 * 60 * 1000;

    cachedServiceToken = {
      accessToken,
      expiresAt,
    };

    return accessToken;
  })();

  try {
    return await serviceTokenRequest;
  } finally {
    serviceTokenRequest = null;
  }
};

export const exchangeUserCredentialsForTokens = async (credentials: {
  username: string;
  password: string;
}) => {
  return normalizeUserTokenBundle(
    await requestOAuthToken(
      new URLSearchParams({
        grant_type: "password",
        username: credentials.username,
        password: credentials.password,
      }),
    ),
  );
};

const refreshUserTokens = async (refreshToken: string) => {
  return normalizeUserTokenBundle(
    await requestOAuthToken(
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    ),
  );
};

export const applyUserTokenCookies = (
  response: NextResponse,
  tokenBundle: UserTokenBundle,
  isSecureContext: boolean,
) => {
  const baseCookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureContext,
  };

  response.cookies.set({
    ...baseCookieOptions,
    name: USER_ACCESS_TOKEN_COOKIE,
    value: tokenBundle.accessToken,
    expires: new Date(tokenBundle.accessTokenExpiresAt),
  });

  response.cookies.set({
    ...baseCookieOptions,
    name: USER_ACCESS_TOKEN_EXPIRES_AT_COOKIE,
    value: String(tokenBundle.accessTokenExpiresAt),
    expires: new Date(tokenBundle.accessTokenExpiresAt),
  });

  if (tokenBundle.refreshToken && tokenBundle.refreshTokenExpiresAt) {
    response.cookies.set({
      ...baseCookieOptions,
      name: USER_REFRESH_TOKEN_COOKIE,
      value: tokenBundle.refreshToken,
      expires: new Date(tokenBundle.refreshTokenExpiresAt),
    });

    response.cookies.set({
      ...baseCookieOptions,
      name: USER_REFRESH_TOKEN_EXPIRES_AT_COOKIE,
      value: String(tokenBundle.refreshTokenExpiresAt),
      expires: new Date(tokenBundle.refreshTokenExpiresAt),
    });
    return;
  }

  response.cookies.delete(USER_REFRESH_TOKEN_COOKIE);
  response.cookies.delete(USER_REFRESH_TOKEN_EXPIRES_AT_COOKIE);
};

export const clearUserTokenCookies = (response: NextResponse) => {
  response.cookies.set({
    name: USER_ACCESS_TOKEN_COOKIE,
    value: "",
    expires: new Date(0),
    path: "/",
  });
  response.cookies.set({
    name: USER_ACCESS_TOKEN_EXPIRES_AT_COOKIE,
    value: "",
    expires: new Date(0),
    path: "/",
  });
  response.cookies.set({
    name: USER_REFRESH_TOKEN_COOKIE,
    value: "",
    expires: new Date(0),
    path: "/",
  });
  response.cookies.set({
    name: USER_REFRESH_TOKEN_EXPIRES_AT_COOKIE,
    value: "",
    expires: new Date(0),
    path: "/",
  });
};

export const getForwardAuthorizationHeader = async (
  req: NextRequest,
  incomingAuthorization?: string | null,
): Promise<ForwardAuthorizationResult> => {
  const requestAuthorization = incomingAuthorization?.trim();

  if (requestAuthorization) {
    return {
      authorization: requestAuthorization,
    };
  }

  const userTokenBundle = readUserTokenBundle(req);
  if (userTokenBundle) {
    if (hasUsableToken(userTokenBundle.accessTokenExpiresAt, USER_TOKEN_REFRESH_WINDOW_MS)) {
      return {
        authorization: `Bearer ${userTokenBundle.accessToken}`,
      };
    }

    if (
      userTokenBundle.refreshToken &&
      hasUsableToken(userTokenBundle.refreshTokenExpiresAt, USER_TOKEN_REFRESH_WINDOW_MS)
    ) {
      try {
        const refreshedUserTokens = await refreshUserTokens(userTokenBundle.refreshToken);
        return {
          authorization: `Bearer ${refreshedUserTokens.accessToken}`,
          refreshedUserTokens,
        };
      } catch {
        return {
          authorization: `Bearer ${await getServiceAccessToken()}`,
          shouldClearUserTokens: true,
        };
      }
    }

    return {
      authorization: `Bearer ${await getServiceAccessToken()}`,
      shouldClearUserTokens: true,
    };
  }

  const accessToken = await getServiceAccessToken();
  return {
    authorization: `Bearer ${accessToken}`,
  };
};

export const jsonError = (error: string, status: number, details?: unknown) =>
  NextResponse.json(
    {
      ok: false,
      error,
      ...(details !== undefined ? { details } : {}),
    },
    { status },
  );

export const readJsonBody = async <T>(req: NextRequest): Promise<T | null> => {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
};

export const withQueryParams = (request: NextRequest, upstreamPath: string) => {
  const upstreamUrl = new URL(upstreamPath);
  const { searchParams } = new URL(request.url);

  searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.set(key, value);
  });

  return upstreamUrl.toString();
};

export const fetchUpstream = async <T>(options: {
  url: string;
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  headers?: HeadersInit;
  redirect?: RequestRedirect;
}): Promise<UpstreamSuccess<T> | UpstreamFailure> => {
  const upstream = await fetch(options.url, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    redirect: options.redirect,
  });

  if (!upstream.ok) {
    const contentType = upstream.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await upstream.json().catch(() => null);
      return {
        ok: false,
        response: NextResponse.json(data ?? { ok: false, error: "upstream_error" }, {
          status: upstream.status,
        }),
      };
    }

    const errorText = await upstream.text().catch(() => "upstream_error");
    return {
      ok: false,
      response: jsonError(errorText || "upstream_error", upstream.status),
    };
  }

  if (upstream.status === 204) {
    return {
      ok: true,
      status: upstream.status,
      data: null,
    };
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return {
      ok: true,
      status: upstream.status,
      data: null,
    };
  }

  return {
    ok: true,
    status: upstream.status,
    data: (await upstream.json()) as T,
  };
};