import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredBaseUrl, jsonError, readJsonBody } from "@/app/api/_lib/proxy";

type RegisterBody = {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
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
    const body = await readJsonBody<RegisterBody>(req);

    if (
      !body ||
      typeof body.username !== "string" ||
      body.username.trim().length === 0 ||
      typeof body.email !== "string" ||
      body.email.trim().length === 0 ||
      typeof body.password !== "string" ||
      body.password.trim().length === 0 ||
      typeof body.firstName !== "string" ||
      body.firstName.trim().length === 0 ||
      typeof body.lastName !== "string" ||
      body.lastName.trim().length === 0
    ) {
      return jsonError("invalid_body", 400);
    }

    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
    if (!base) {
      return jsonError("missing_upstream_base", 500);
    }

    const upstream = await fetch(`${base}/register`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-request-id": randomUUID(),
      },
      body: JSON.stringify({
        username: body.username,
        email: body.email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
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