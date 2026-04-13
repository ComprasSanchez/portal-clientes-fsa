import { NextRequest, NextResponse } from "next/server";
import { getRequiredBaseUrl, jsonError } from "@/app/api/_lib/proxy";

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

export async function GET(req: NextRequest) {
  try {
    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");

    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const upstreamUrl = new URL(`${base}/providers/google/callback`);
    req.nextUrl.searchParams.forEach((value, key) => {
      upstreamUrl.searchParams.set(key, value);
    });

    const cookieHeader = req.headers.get("cookie");
    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        "x-forwarded-host": req.headers.get("host") ?? req.nextUrl.host,
        "x-forwarded-proto": req.nextUrl.protocol.replace(":", ""),
        "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
      redirect: "manual",
    });

    const upstreamSetCookies = getSetCookieList(upstream.headers);
    console.log("[GOOGLE_CALLBACK] Upstream status:", upstream.status);
    console.log("[GOOGLE_CALLBACK] Upstream Set-Cookie:", upstreamSetCookies);

    const body = await upstream.arrayBuffer();
    const response = new NextResponse(body, { status: upstream.status });

    for (const [key, value] of upstream.headers.entries()) {
      const lower = key.toLowerCase();
      if (lower === "set-cookie" || lower === "transfer-encoding") continue;
      response.headers.set(key, value);
    }

    for (const cookie of upstreamSetCookies) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  } catch {
    return jsonError("proxy_failure", 500);
  }
}
