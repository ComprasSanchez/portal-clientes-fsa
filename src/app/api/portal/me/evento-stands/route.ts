import { NextRequest } from "next/server";
import { forwardEventoStands } from "./_lib/forward";

export async function GET(req: NextRequest) {
  return forwardEventoStands(req, "", "GET");
}
