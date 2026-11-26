import { NextRequest } from "next/server";
import { forwardCalendario } from "../_lib/forward";

/** Retira los regalos pendientes con el código del QR de una sucursal. */
export async function POST(req: NextRequest) {
  return forwardCalendario(req, "/retiros", "POST");
}
