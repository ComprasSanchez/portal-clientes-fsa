export type SociosView =
  | "dashboard"
  | "mi-cuenta"
  | "facturas"
  | "puntos"
  | "sorteos"
  | "sucursales"
  | "pedidos"
  | "colaboradores-ventas"
  | "colaboradores-aplicaciones";

/** Vistas de la sección Colaboradores: solo para colaboradores activos. */
export const COLABORADORES_VIEWS = [
  "colaboradores-ventas",
  "colaboradores-aplicaciones",
] as const satisfies readonly SociosView[];

export const isColaboradoresView = (view: SociosView): boolean =>
  (COLABORADORES_VIEWS as readonly SociosView[]).includes(view);
