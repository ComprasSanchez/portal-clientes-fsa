import { NextRequest } from "next/server";
import { forwardFiesta } from "../../_lib/forward";

/** "Dosis de Conexión": datos para activar la cuenta de Dr. Call. */
export async function GET(req: NextRequest) {
  return forwardFiesta(req, "/invitacion/drcall", "GET");
}

/** "Dosis de Conexión": el invitado toca "Activar" (alta en Dr. Call). */
export async function POST(req: NextRequest) {
  return forwardFiesta(req, "/invitacion/drcall", "POST");
}
