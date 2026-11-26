// Sucursal favorita del socio (calendario de fin de año y Mi perfil).
import type { Sucursal } from "@/types/sucursal";

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Solo sucursales con número (es lo que se guarda), filtradas por texto y ordenadas por número. */
export function filtrarSucursalesFavorita(sucursales: Sucursal[], busqueda: string): Sucursal[] {
  const q = normalizar(busqueda.trim());
  return sucursales
    .filter((s) => s.codigo)
    .filter((s) => !q || normalizar(`${s.codigo} ${s.nombre} ${s.direccion}`).includes(q))
    .sort((a, b) => Number(a.codigo) - Number(b.codigo) || (a.codigo ?? "").localeCompare(b.codigo ?? ""));
}

/** Nombre para mostrar de la sucursal guardada (número de respaldo mientras carga el listado). */
export function nombreSucursalFavorita(sucursales: Sucursal[], codigo: string | null | undefined): string | null {
  if (!codigo) return null;
  return sucursales.find((s) => s.codigo === codigo)?.nombre ?? `Sucursal ${codigo}`;
}

/** Guarda la sucursal favorita en el perfil. */
export async function guardarSucursalFavorita(codigo: string): Promise<void> {
  const res = await fetch("/api/portal/me/sucursal-favorita", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sucursalFavorita: codigo }),
  });
  if (!res.ok) throw new Error("No pudimos guardar tu sucursal. Probá de nuevo.");
}
