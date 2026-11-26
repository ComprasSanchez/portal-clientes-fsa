import { NextRequest } from "next/server";
import { jsonError } from "@/app/api/_lib/proxy";
import { fechaValida, forwardCalendario } from "@/app/api/portal/me/calendario/_lib/forward";

const RAIZ = "/portal/me/colaborador/calendario";

type Ctx = { params: Promise<{ fecha: string }> };

/** Carga o reemplaza el contenido de un día. */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { fecha } = await params;
  if (!fechaValida(fecha)) return jsonError("invalid_fecha", 400);
  return forwardCalendario(req, `/dias/${fecha}`, "PUT", RAIZ);
}

/** Deja el día sin contenido. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { fecha } = await params;
  if (!fechaValida(fecha)) return jsonError("invalid_fecha", 400);
  return forwardCalendario(req, `/dias/${fecha}`, "DELETE", RAIZ);
}
