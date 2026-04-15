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
};

type CachedServiceToken = {
  accessToken: string;
  expiresAt: number;
};

const SERVICE_TOKEN_REFRESH_WINDOW_MS = 60_000;

let cachedServiceToken: CachedServiceToken | null = null;
let serviceTokenRequest: Promise<string> | null = null;

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

export const getServiceAccessToken = async () => {
  const cachedAccessToken = getCachedServiceAccessToken();
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  if (serviceTokenRequest) {
    return serviceTokenRequest;
  }

  const tokenUrl = sanitizeEnvValue("FSA_AUTH_TOKEN_URL");
  const username = sanitizeEnvValue("FSA_AUTH_TOKEN_USERNAME");
  const password = sanitizeEnvValue("FSA_AUTH_TOKEN_PASSWORD");

  if (!tokenUrl || !username || !password) {
    throw new Error("missing_service_token_config");
  }

  serviceTokenRequest = (async () => {
    const body = new URLSearchParams({
      grant_type: "password",
      username,
      password,
    });

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
      throw new Error(details || "service_token_request_failed");
    }

    const data = (await response.json()) as ServiceTokenResponse;
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

export const getForwardAuthorizationHeader = async (incomingAuthorization?: string | null) => {
  const requestAuthorization = incomingAuthorization?.trim();

  if (requestAuthorization) {
    return requestAuthorization;
  }

  const accessToken = await getServiceAccessToken();
  return `Bearer ${accessToken}`;
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