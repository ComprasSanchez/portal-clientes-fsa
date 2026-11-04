import { NextRequest } from "next/server";
import { forwardFiesta } from "./_lib/forward";

export async function GET(req: NextRequest) {
  return forwardFiesta(req, "", "GET");
}
