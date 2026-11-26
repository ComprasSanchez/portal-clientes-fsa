// Carga del calendario de fin de año desde Colaboradores (solo personal habilitado).
import { pedir } from "@/lib/use-portal-calendario";
import type { CalendarioTipoDia } from "@/types/portal-calendario";

const BASE = "/api/portal/me/colaborador/calendario";

export type PreguntaAdmin = {
  id: string;
  texto: string;
  opciones: { id: string; texto: string }[];
  correctaId: string;
};

/** Contenido completo de un día (la trivia incluye la respuesta correcta). */
export type ContenidoAdmin =
  | { tipo: "TRIVIA"; puntos: number; preguntas: PreguntaAdmin[] }
  | { tipo: "DESCUENTO_MARCA"; marca: string; porcentaje: number; condiciones: string | null }
  | { tipo: "DESCUENTO_GENERAL"; titulo: string; detalle: string | null; condiciones: string | null }
  | { tipo: "SORTEO"; cantidadRegalos: number; queSeGana: string | null }
  | { tipo: "PREMIO"; stockTotal: number; queSeGana: string | null };

export type ContenidoDe<T extends CalendarioTipoDia> = Extract<ContenidoAdmin, { tipo: T }>;

export type BloqueoDia = "PASADO" | "CON_PARTICIPANTES" | "SORTEO_HECHO";

export type DiaAdmin = {
  fecha: string;
  /** null = sin cargar. */
  contenido: ContenidoAdmin | null;
  /** Socios que ya lo abrieron. */
  aperturas: number;
  /** null = se puede editar. */
  bloqueo: BloqueoDia | null;
};

export const consultarPermisoCalendario = () => pedir<{ habilitado: boolean }>(`${BASE}/permiso`);

export const listarDiasAdmin = () => pedir<{ dias: DiaAdmin[] }>(`${BASE}/dias`);

export const guardarDiaAdmin = (fecha: string, contenido: ContenidoAdmin) =>
  pedir<DiaAdmin>(`${BASE}/dias/${fecha}`, { contenido }, "PUT");

export const vaciarDiaAdmin = (fecha: string) => pedir<void>(`${BASE}/dias/${fecha}`, undefined, "DELETE");

export const TIPO_DIA_NOMBRE: Record<CalendarioTipoDia, string> = {
  DESCUENTO_MARCA: "Descuento de marca",
  DESCUENTO_GENERAL: "Descuento general",
  TRIVIA: "Trivia",
  SORTEO: "Sorteo",
  PREMIO: "Regalo hasta agotar",
};

export const TIPOS_DIA = Object.keys(TIPO_DIA_NOMBRE) as CalendarioTipoDia[];

export const BLOQUEO_TEXTO: Record<BloqueoDia, string> = {
  PASADO: "Ya pasó",
  CON_PARTICIPANTES: "Ya lo abrieron",
  SORTEO_HECHO: "Sorteo hecho",
};

/** Una línea que resume lo cargado ("20% OFF en Dermaglós"). */
export function resumenContenido(c: ContenidoAdmin): string {
  switch (c.tipo) {
    case "DESCUENTO_MARCA":
      return `${c.porcentaje}% OFF en ${c.marca}`;
    case "DESCUENTO_GENERAL":
      return c.titulo;
    case "TRIVIA": {
      const n = c.preguntas.length;
      return `${n} ${n === 1 ? "pregunta" : "preguntas"} · ${c.puntos} puntos`;
    }
    case "SORTEO":
      return `${c.cantidadRegalos} ${c.cantidadRegalos === 1 ? "ganador" : "ganadores"} · ${c.queSeGana ?? "regalo sorpresa"}`;
    case "PREMIO":
      return `${c.stockTotal} ${c.stockTotal === 1 ? "regalo" : "regalos"} · ${c.queSeGana ?? "regalo sorpresa"}`;
  }
}

/** Número entero dentro del rango, o null. */
export function enteroEntre(texto: string, min: number, max: number): number | null {
  if (!/^\d{1,7}$/.test(texto)) return null;
  const n = Number(texto);
  return n >= min && n <= max ? n : null;
}

/** "Martes 1 de diciembre" */
export function fechaLarga(fecha: string): string {
  const texto = new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${fecha}T12:00:00Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1).replace(",", "");
}

/** Casillas vacías antes del primer día para que la grilla arranque en lunes. */
export const huecosAntesDe = (fecha: string) => (new Date(`${fecha}T12:00:00Z`).getUTCDay() + 6) % 7;

export const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
