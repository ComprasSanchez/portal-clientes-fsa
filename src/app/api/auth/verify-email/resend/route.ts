import { NextRequest, NextResponse } from "next/server";
import { getRequiredBaseUrl, jsonError, readJsonBody } from "@/app/api/_lib/proxy";

type ResendVerifyEmailBody = {
  email?: string;
};

const getForwardedCookieHeader = (req: NextRequest) => {
  const trustedDeviceToken = req.cookies.get("trusted_device_token")?.value;

  if (!trustedDeviceToken) {
    return null;
  }

  return `trusted_device_token=${trustedDeviceToken}`;
};

const buildUpstreamErrorResponse = async (upstream: Response) => {
  const contentType = upstream.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await upstream.json().catch(() => null);
    return NextResponse.json(data ?? { ok: false, error: "upstream_error" }, {
      status: upstream.status,
    });
  }

  const text = await upstream.text().catch(() => "upstream_error");
  return jsonError(text || "upstream_error", upstream.status);
};

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<ResendVerifyEmailBody>(req);

    if (!body || typeof body.email !== "string" || body.email.trim().length === 0) {
      return jsonError("invalid_body", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const forwardedCookieHeader = getForwardedCookieHeader(req);

    const upstream = await fetch(`${base}/verify-email/resend`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(forwardedCookieHeader ? { Cookie: forwardedCookieHeader } : {}),
      },
      body: JSON.stringify({
        email: body.email,
      }),
      cache: "no-store",
      redirect: "manual",
    });

    if (!upstream.ok) {
      return await buildUpstreamErrorResponse(upstream);
    }

    const data = await upstream.json().catch(() => null);
    return NextResponse.json(data ?? { ok: true }, { status: upstream.status });
  } catch {
    return jsonError("proxy_failure", 500);
  }
}