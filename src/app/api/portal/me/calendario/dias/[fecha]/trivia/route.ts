import { NextRequest } from "next/server";
import { jsonError } from "@/app/api/_lib/proxy";
import { fechaValida, forwardCalendario } from "../../../_lib/forward";

/** Responde la trivia del día. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ fecha: string }> }) {
  const { fecha } = await params;
  if (!fechaValida(fecha)) return jsonError("invalid_fecha", 400);
  return forwardCalendario(req, `/dias/${fecha}/trivia`, "POST");
}
