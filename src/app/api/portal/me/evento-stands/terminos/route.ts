import { NextRequest } from "next/server";
import { forwardEventoStands } from "../_lib/forward";

export async function POST(req: NextRequest) {
  return forwardEventoStands(req, "/terminos", "POST");
}
