import { redirect } from "next/navigation";

/** El juego de stands vive dentro de /socios (con el menú del portal). */
export default function EventoPage() {
  redirect("/socios?view=evento");
}
