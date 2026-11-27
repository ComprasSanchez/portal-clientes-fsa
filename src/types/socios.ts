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
  /** Catálogo AutoBeauty (Serendipity + Accurato). */
  | "beauty"
  | "colaboradores-ventas"
  | "colaboradores-aplicaciones"
  /** Contraseña nueva para un socio (solo personal habilitado). */
  | "colaboradores-claves"
  /** Validar la identidad de un socio que ya no tiene los contactos de su ficha (solo personal habilitado). */
  | "colaboradores-identidad"
  /** Carga del calendario de fin de año (solo personal habilitado, temporal). */
  | "colaboradores-calendario"
  /** QR para entregar los regalos del calendario (temporal). */
  | "colaboradores-entregas"
  /** Fiesta de fin de año de colaboradores (temporal). */
  | "colaboradores-fiesta"
  /** "Dosis de Conexión": fiesta de médicos, farmacéuticos y visitadores (solo invitados, temporal). */
  | "dosis"
  /** Fin de año (temporal): calendario de regalos, tour y fotos. */
  | "fin-de-anio-calendario"
  | "fin-de-anio-tour"
  | "fin-de-anio-fotos";

export const FIN_DE_ANIO_VIEWS = [
  "fin-de-anio-calendario",
  "fin-de-anio-tour",
  "fin-de-anio-fotos",
] as const satisfies readonly SociosView[];

export const isFinDeAnioView = (view: SociosView): boolean =>
  (FIN_DE_ANIO_VIEWS as readonly SociosView[]).includes(view);

/** Vistas de la sección Colaboradores: solo para colaboradores activos. */
export const COLABORADORES_VIEWS = [
  "colaboradores-ventas",
  "colaboradores-aplicaciones",
  "colaboradores-claves",
  "colaboradores-identidad",
  "colaboradores-calendario",
  "colaboradores-entregas",
  "colaboradores-fiesta",
] as const satisfies readonly SociosView[];

export const isColaboradoresView = (view: SociosView): boolean =>
  (COLABORADORES_VIEWS as readonly SociosView[]).includes(view);
