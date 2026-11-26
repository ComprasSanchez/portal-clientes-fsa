import { NextRequest, NextResponse } from "next/server";
import { buildForwardHeaders, fetchUpstream, getRequiredBaseUrl, jsonError } from "@/app/api/_lib/proxy";
import { isFinDeAnioVisible } from "@/lib/fin-de-anio";
import type { PortalPerfilResponse } from "@/types/portal-profile";

/**
 * Si la persona ve la sección "Fin de año". FIN_DE_ANIO_DNIS (solo servidor, DNIs con
 * coma) la limita a esas personas, que la ven aunque no sea 1/12; vacía = todos desde el 1/12.
 */
export async function GET(req: NextRequest) {
  const dnis = (process.env.FIN_DE_ANIO_DNIS ?? "")
    .split(",")
    .map((v) => v.replace(/\D/g, ""))
    .filter(Boolean);
  if (!dnis.length) return NextResponse.json({ visible: isFinDeAnioVisible() });

  try {
    const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_SOCIOSA");
    if (!base) return jsonError("missing_upstream_base", 500);
    const { authorization, cookie, requestId } = buildForwardHeaders(req);
    const result = await fetchUpstream<PortalPerfilResponse>({
      url: `${base}/portal/me/perfil`,
      headers: {
        "x-request-id": requestId,
        ...(authorization ? { Authorization: authorization } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
    });
    // Sin perfil (ej. cuenta sin validar) no se muestra.
    const dni = result.ok ? (result.data?.documento?.numero ?? "").replace(/\D/g, "") : "";
    return NextResponse.json({ visible: Boolean(dni) && dnis.includes(dni) });
  } catch {
    return NextResponse.json({ visible: false });
  }
}
