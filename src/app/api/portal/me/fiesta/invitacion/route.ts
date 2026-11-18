import { NextRequest } from "next/server";
import { forwardFiesta } from "../_lib/forward";

/** "Dosis de Conexión": la invitación del socio (si está en la lista). */
export async function GET(req: NextRequest) {
  return forwardFiesta(req, "/invitacion", "GET");
}
