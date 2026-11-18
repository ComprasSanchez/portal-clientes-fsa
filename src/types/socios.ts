export type SociosView =
  | "dashboard"
  | "mi-cuenta"
  | "facturas"
  | "puntos"
  | "sorteos"
  | "sucursales"
  | "pedidos"
  | "notificaciones"
  /** Juego de stands con QR del evento de Breve (temporal). */
  | "evento"
  | "colaboradores-ventas"
  | "colaboradores-aplicaciones"
  /** Contraseña nueva para un socio (solo personal habilitado). */
  | "colaboradores-claves"
  /** Fiesta de fin de año de colaboradores (temporal). */
  | "colaboradores-fiesta"
  /** "Dosis de Conexión": fiesta de médicos, farmacéuticos y visitadores (solo invitados, temporal). */
  | "dosis";

/** Vistas de la sección Colaboradores: solo para colaboradores activos. */
export const COLABORADORES_VIEWS = [
  "colaboradores-ventas",
  "colaboradores-aplicaciones",
  "colaboradores-claves",
  "colaboradores-fiesta",
] as const satisfies readonly SociosView[];

export const isColaboradoresView = (view: SociosView): boolean =>
  (COLABORADORES_VIEWS as readonly SociosView[]).includes(view);
