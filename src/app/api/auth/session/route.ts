import { NextRequest, NextResponse } from "next/server";
import { getRequiredBaseUrl } from "@/app/api/_lib/proxy";
import { SESSION_EXPIRY_COOKIE_NAME } from "@/app/api/auth/_lib/session-cookie";

const resolveParentCookieDomain = () => {
  const configured = process.env.COOKIE_DOMAIN?.trim();
  if (!configured) return null;
  return configured.startsWith(".") ? configured : `.${configured}`;
};

const clearSessionCookies = (response: NextResponse) => {
  const names = ["sid", SESSION_EXPIRY_COOKIE_NAME];
  for (const name of names) {
    response.cookies.set({ name, value: "", expires: new Date(0), path: "/" });
  }

  // Variantes con Domain: a mano y al final, porque cookies.set() reescribe
  // todos los Set-Cookie y además indexa por nombre (pisaría el host-only).
  const parentDomain = resolveParentCookieDomain();
  if (!parentDomain) return;
  for (const name of names) {
    response.headers.append(
      "Set-Cookie",
      `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=${parentDomain}`,
    );
  }
};

/**
 * La sesión se comparte con Cronicos/Compras (misma `sid` en bff-gateway): si
 * se cierra desde otra app, la cookie puede seguir acá aunque la sesión ya no
 * exista. Por eso, si hay `sid`, se confirma contra el bff que siga viva.
 */
const isSessionAlive = async (req: NextRequest): Promise<boolean | null> => {
  const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
  if (!base) return null;

  try {
    const upstream = await fetch(`${base}/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: req.headers.get("cookie") ?? "",
      },
      cache: "no-store",
      redirect: "manual",
    });
    if (upstream.status === 401 || upstream.status === 403) return false;
    if (!upstream.ok) return null;
    return true;
  } catch {
    // Error de red: no se puede afirmar nada, no se corta la sesión por eso.
    return null;
  }
};

export async function GET(req: NextRequest) {
  const sid = req.cookies.get("sid")?.value;
  const rawExpiresAt = req.cookies.get(SESSION_EXPIRY_COOKIE_NAME)?.value;
  const expiresAtMs = rawExpiresAt ? Number(rawExpiresAt) : null;
  const expiresAt =
    typeof expiresAtMs === "number" && Number.isFinite(expiresAtMs)
      ? expiresAtMs
      : null;

  if (!sid) {
    return NextResponse.json({ ok: true, authenticated: false, expiresAt: null });
  }

  const alive = await isSessionAlive(req);

  if (alive === false) {
    const response = NextResponse.json({
      ok: true,
      authenticated: false,
      expiresAt: null,
    });
    clearSessionCookies(response);
    return response;
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    expiresAt,
  });
}
