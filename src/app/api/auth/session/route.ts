import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get("sid")?.value;

  return NextResponse.json({
    ok: true,
    authenticated: Boolean(sid),
  });
}
