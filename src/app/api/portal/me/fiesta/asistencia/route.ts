import { NextRequest } from "next/server";
import { forwardFiesta } from "../_lib/forward";

export async function POST(req: NextRequest) {
  return forwardFiesta(req, "/asistencia", "POST");
}
