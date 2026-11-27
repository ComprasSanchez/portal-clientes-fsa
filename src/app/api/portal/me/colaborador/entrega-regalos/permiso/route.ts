import { NextRequest } from "next/server";
import { forwardCalendario } from "@/app/api/portal/me/calendario/_lib/forward";

/** Si puede entregar regalos del calendario (colaboradores). */
export async function GET(req: NextRequest) {
  return forwardCalendario(req, "/permiso", "GET", "/portal/me/colaborador/entrega-regalos");
}
