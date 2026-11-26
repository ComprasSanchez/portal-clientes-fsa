import { NextRequest } from "next/server";
import { forwardCalendario } from "@/app/api/portal/me/calendario/_lib/forward";

/** Todos los días del calendario con su contenido (solo personal habilitado). */
export async function GET(req: NextRequest) {
  return forwardCalendario(req, "/dias", "GET", "/portal/me/colaborador/calendario");
}
