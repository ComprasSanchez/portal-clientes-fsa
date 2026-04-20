import { NextRequest, NextResponse } from "next/server";
import { buildForwardHeaders, getRequiredBaseUrl, jsonError, readJsonBody } from "@/app/api/_lib/proxy";

const splitCombinedSetCookieHeader = (setCookieHeader: string) => {
  return setCookieHeader
    .split(/,(?=[^;=]+=[^;]+)/g)
    .map((value) => value.trim())
    .filter(Boolean);
};

const getSetCookieList = (headers: Headers): string[] => {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };

  if (typeof withGetSetCookie.getSetCookie === "function") {
    return withGetSetCookie.getSetCookie();
  }

  const single = headers.get("set-cookie");
  return single ? splitCombinedSetCookieHeader(single) : [];
};

const forwardGoogleComplete = async (req: NextRequest) => {
  const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");

  if (!base) {
    return jsonError("missing_upstream_base", 500);
  }

  const upstreamUrl = new URL(`${base}/providers/google/complete`);
  req.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.set(key, value);
  });

  const body = await readJsonBody<unknown>(req);
  const { authorization, cookie, requestId } = buildForwardHeaders(req);
  const upstream = await fetch(upstreamUrl.toString(), {
    method: req.method,
    headers: {
      Accept: "application/json",
      ...(body !== null ? { "Content-Type": "application/json" } : {}),
      "x-request-id": requestId,
      "x-forwarded-host": req.headers.get("host") ?? req.nextUrl.host,
      "x-forwarded-proto": req.nextUrl.protocol.replace(":", ""),
      "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
      ...(authorization ? { Authorization: authorization } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body !== null ? JSON.stringify(body) : undefined,
    cache: "no-store",
    redirect: "manual",
  });

  const response = new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
  });

  for (const [key, value] of upstream.headers.entries()) {
    const lower = key.toLowerCase();
    if (lower === "set-cookie" || lower === "transfer-encoding") {
      continue;
    }

    response.headers.set(key, value);
  }

  for (const setCookie of getSetCookieList(upstream.headers)) {
    response.headers.append("set-cookie", setCookie);
  }

  return response;
};

export async function GET(req: NextRequest) {
  try {
    return await forwardGoogleComplete(req);
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}

export async function POST(req: NextRequest) {
  try {
    return await forwardGoogleComplete(req);
  } catch (error) {
    return jsonError("proxy_failure", 500, String(error));
  }
}