import { NextRequest } from "next/server";
import { forwardCalendario } from "./_lib/forward";

/** Calendario de fin de año del socio. */
export async function GET(req: NextRequest) {
  return forwardCalendario(req, "", "GET");
}
