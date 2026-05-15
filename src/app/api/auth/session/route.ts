import { NextRequest, NextResponse } from "next/server";
import { SESSION_EXPIRY_COOKIE_NAME } from "@/app/api/auth/_lib/session-cookie";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get("sid")?.value;
  const rawExpiresAt = req.cookies.get(SESSION_EXPIRY_COOKIE_NAME)?.value;
  const expiresAtMs = rawExpiresAt ? Number(rawExpiresAt) : null;
  const expiresAt =
    typeof expiresAtMs === "number" && Number.isFinite(expiresAtMs)
      ? expiresAtMs
      : null;

  return NextResponse.json({
    ok: true,
    authenticated: Boolean(sid),
    expiresAt,
  });
}
