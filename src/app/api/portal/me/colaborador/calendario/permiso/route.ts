import { NextRequest } from "next/server";
import { forwardCalendario } from "@/app/api/portal/me/calendario/_lib/forward";

/** Si puede cargar el contenido del calendario (solo personal habilitado). */
export async function GET(req: NextRequest) {
  return forwardCalendario(req, "/permiso", "GET", "/portal/me/colaborador/calendario");
}
