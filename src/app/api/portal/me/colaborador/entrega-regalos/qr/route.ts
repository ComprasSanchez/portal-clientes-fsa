import { NextRequest } from "next/server";
import { forwardCalendario } from "@/app/api/portal/me/calendario/_lib/forward";

/** QR que muestra el personal para entregar regalos. */
export async function POST(req: NextRequest) {
  return forwardCalendario(req, "/qr", "POST", "/portal/me/colaborador/entrega-regalos");
}
