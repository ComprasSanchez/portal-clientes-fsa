// Fiesta de fin de año de colaboradores (temporal). Lógica pura, sin UI.

import type { PortalFiestaMovimiento, PortalMiFiesta } from "@/types/portal-fiesta";

/** Se prende con NEXT_PUBLIC_FIESTA_ACTIVA=true; apagado, la sección no aparece. */
export const isFiestaActiva = () => process.env.NEXT_PUBLIC_FIESTA_ACTIVA === "true";

const CODIGO_RE = /^[A-Za-z0-9-]{4,40}$/;

/**
 * Del texto del QR de la entrada saca el código. El QR lleva
 * `https://<portal>/fiesta/<codigo>`; también se acepta el código solo.
 */
export function extraerCodigoIngreso(texto: string): string | null {
  const limpio = texto.trim();
  try {
    const url = new URL(limpio);
    const match = url.pathname.match(/^\/fiesta\/([A-Za-z0-9-]{4,40})\/?$/);
    return match ? match[1] : null;
  } catch {
    return CODIGO_RE.test(limpio) ? limpio : null;
  }
}

const TIPOS: Record<string, string> = {
  ingreso: "Ingreso al evento",
  puntualidad: "Llegaste a tiempo",
  reconocimiento: "Reconocimiento",
  actividad: "Actividad",
  ganador: "¡Ganaste!",
  pasaporte: "Pasaporte completo",
  canje: "Canje de premios",
  ajuste: "Ajuste",
};

/** Texto de cada línea del historial de puntos. */
export function textoMovimiento(
  m: PortalFiestaMovimiento,
  actividades: PortalMiFiesta["actividades"],
): string {
  const base = TIPOS[m.tipo] ?? m.tipo;
  const actividad = m.actividad_id
    ? actividades.find((a) => a.id === m.actividad_id)?.nombre
    : undefined;
  return actividad ? `${base}: ${actividad}` : base;
}

/** Estado de la credencial impresa, en palabras. */
export function textoCredencial(impresion: string | null): {
  titulo: string;
  texto: string;
  lista: boolean;
} {
  if (impresion === "impresa") {
    return {
      titulo: "Tu credencial está lista",
      texto: "Retirala en la posta 1 y colgala a la vista: los referentes la escanean en cada actividad.",
      lista: true,
    };
  }
  if (impresion === "error") {
    return {
      titulo: "Hubo un problema al imprimir",
      texto: "Acercate a la posta 1 y pedí que la reimpriman.",
      lista: false,
    };
  }
  return {
    titulo: "Estamos imprimiendo tu credencial",
    texto: "En un momento aparece tu nombre en la pantalla de la posta 1. Retirala ahí.",
    lista: false,
  };
}

/** Nivel con tope de un premio por persona. */
export const NIVEL_UNO_POR_PERSONA = "D";

export const NIVELES_PREMIO: Record<string, string> = {
  A: "Categoría A",
  B: "Categoría B",
  C: "Categoría C",
  D: "Categoría D",
};

/** Texto para el colaborador según el código de error del backend. */
export function mensajeErrorFiesta(code: string | null | undefined): string {
  switch (code) {
    case "EVENTO_FIESTA_INACTIVO":
      return "El evento todavía no está habilitado.";
    case "EVENTO_FIESTA_NO_COLABORADOR":
      return "Esta sección es solo para colaboradores de Sánchez Antoniolli.";
    case "EVENTO_FIESTA_CODIGO_INGRESO_INVALIDO":
      return "El código de la entrada venció. Volvé a escanear el QR de la entrada.";
    case "EVENTO_FIESTA_CLIENTE_REQUERIDO":
      return "Necesitamos que confirmes tu identidad en el portal para entrar al evento.";
    default:
      return "No pudimos completar la acción. Probá de nuevo en un momento.";
  }
}

export const leerCodigoError = (data: unknown): string | null => {
  if (typeof data !== "object" || data === null) return null;
  const code = (data as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
};

export const formatPuntosFiesta = (n: number) =>
  new Intl.NumberFormat("es-AR").format(n);
