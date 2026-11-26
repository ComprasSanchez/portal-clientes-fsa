// Calendario de fin de año: contrato de /api/portal/me/calendario (eventos-back, camelCase).

export type CalendarioTipoDia =
  | "TRIVIA"
  | "DESCUENTO_MARCA"
  | "SORTEO"
  | "PREMIO"
  | "DESCUENTO_GENERAL";

export type CalendarioEstadoCasilla = "FUTURA" | "DISPONIBLE" | "ABIERTA" | "VENCIDA";

export type CalendarioPregunta = {
  id: string;
  texto: string;
  opciones: { id: string; texto: string }[];
};

export type CalendarioContenido =
  | { tipo: "TRIVIA"; puntos: number; preguntas: CalendarioPregunta[] }
  | { tipo: "DESCUENTO_MARCA"; marca: string; porcentaje: number; condiciones: string | null; imagenUrl: string | null }
  | { tipo: "SORTEO"; cantidadRegalos: number; queSeGana?: string | null }
  | { tipo: "PREMIO"; stockTotal: number; queSeGana?: string | null }
  | { tipo: "DESCUENTO_GENERAL"; titulo: string; detalle: string | null; condiciones: string | null };

export type CalendarioResultado =
  | { tipo: "TRIVIA" }
  | { tipo: "DESCUENTO_MARCA" }
  | { tipo: "DESCUENTO_GENERAL" }
  | { tipo: "SORTEO"; cantidadRegalos: number }
  | { tipo: "PREMIO"; gano: boolean; quedan: number; total: number };

export type CalendarioCasilla = {
  fecha: string;
  /** null = el día todavía no tiene contenido cargado. */
  tipo: CalendarioTipoDia | null;
  estado: CalendarioEstadoCasilla;
  /** Solo viene si la abrió. */
  contenido: CalendarioContenido | null;
  resultado: CalendarioResultado | null;
  /** Frase cuando el premio se agotó. */
  mensaje: string | null;
  trivia: { respondida: boolean; correcta: boolean | null; puntos: number } | null;
  sorteo: "PENDIENTE" | "GANASTE" | "NO_GANASTE" | null;
};

export type CalendarioRegalo = {
  fecha: string;
  origen: "PREMIO" | "SORTEO";
  retiradoAt: string | null;
  sucursalRetiro: string | null;
};

export type CalendarioDelSocio = {
  edicion: string;
  hoy: string;
  desde: string;
  hasta: string;
  casillas: CalendarioCasilla[];
  regalosPendientes: CalendarioRegalo[];
};

export type CalendarioRetiro = {
  sucursal: string;
  retirados: CalendarioRegalo[];
};
