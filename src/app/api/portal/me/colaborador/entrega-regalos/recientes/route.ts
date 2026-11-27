import { NextRequest } from "next/server";
import { forwardCalendario } from "@/app/api/portal/me/calendario/_lib/forward";

/** Últimos regalos que entregó. */
export async function GET(req: NextRequest) {
  return forwardCalendario(req, "/recientes", "GET", "/portal/me/colaborador/entrega-regalos");
}
