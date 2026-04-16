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

export const buildForwardHeaders = (req: NextRequest) => {
  const authorization = req.headers.get("authorization")?.trim() || null;
  const cookie = req.headers.get("cookie");
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  return {
    authorization,
    cookie,
    requestId,
  };
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