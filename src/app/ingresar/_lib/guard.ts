import { redirect } from "next/navigation";
import { isLoginNuevoActivo } from "@/lib/auth-nuevo";

/** Con el login nuevo apagado, estas pantallas no existen: vuelve al login de siempre. */
export function exigirLoginNuevo(): void {
  if (!isLoginNuevoActivo()) redirect("/");
}
