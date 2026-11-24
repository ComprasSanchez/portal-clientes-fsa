import { NextRequest } from "next/server";
import { forwardCalendario } from "../_lib/forward";

/** Solo pruebas: vuelve a cerrar todas las casillas del socio (eventos-back lo rechaza fuera de modo prueba). */
export async function DELETE(req: NextRequest) {
  return forwardCalendario(req, "/aperturas", "DELETE");
}
