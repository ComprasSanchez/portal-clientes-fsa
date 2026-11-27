import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRequiredBaseUrl } from "@/app/api/_lib/proxy";
import { isLoginNuevoActivo } from "@/lib/auth-nuevo";

/** Con el login nuevo apagado, estas pantallas no existen: vuelve al login de siempre. */
export function exigirLoginNuevo(): void {
  if (!isLoginNuevoActivo()) redirect("/");
}

type IngresoSearchParams = Promise<{
  redirectTo?: string | string[];
  sessionExpired?: string | string[];
}>;

const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

// Confirma contra el gateway: una cookie vieja no alcanza (evita el bucle con la sesión vencida).
const sesionViva = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  if (!cookieStore.get("sid")?.value) return false;

  const base = getRequiredBaseUrl("NEXT_PUBLIC_FSA_AUTH");
  if (!base) return false;

  try {
    const res = await fetch(`${base}/me`, {
      headers: { Accept: "application/json", Cookie: cookieStore.toString() },
      cache: "no-store",
      redirect: "manual",
    });
    return res.ok;
  } catch {
    return false;
  }
};

/** Si ya hay una sesión abierta (por ejemplo, en otra pestaña), entra directo. */
export async function entrarSiYaHaySesion(
  searchParams: IngresoSearchParams,
): Promise<void> {
  const query = await searchParams;
  if (first(query.sessionExpired) === "1") return;
  if (!(await sesionViva())) return;

  const redirectTo = first(query.redirectTo);
  const destino =
    redirectTo?.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/socios";
  redirect(destino);
}
