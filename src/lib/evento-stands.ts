// Juego de stands con QR del evento de Breve (temporal). Lógica pura, sin UI.

import type { PortalAvanceEvento } from "@/types/portal-evento-stands";

/** Se apaga con NEXT_PUBLIC_EVENTO_STANDS_ACTIVO=false cuando termina el evento. */
export const isEventoStandsActivo = () =>
  process.env.NEXT_PUBLIC_EVENTO_STANDS_ACTIVO === "true";

const CODIGO_RE = /^[A-Za-z0-9-]{4,40}$/;

/**
 * Del texto de un QR saca el código del stand. Los QR impresos llevan el link
 * `https://<portal>/evento/<codigo>`; también se acepta el código solo.
 */
export function extraerCodigoDeQr(texto: string): string | null {
  const limpio = texto.trim();
  try {
    const url = new URL(limpio);
    const match = url.pathname.match(/^\/evento\/([A-Za-z0-9-]{4,40})\/?$/);
    return match ? match[1] : null;
  } catch {
    return CODIGO_RE.test(limpio) ? limpio : null;
  }
}

/** Nombres de los stands que ya escaneó, en orden (los ve el personal al entregar). */
export const nombresEscaneados = (avance: PortalAvanceEvento): string[] =>
  avance.stands.filter((s) => s.escaneado).map((s) => s.nombre);

export function textoProgresoPremio(avance: PortalAvanceEvento): string {
  if (avance.premio_entregado) return "Regalo entregado. ¡Gracias por participar!";
  if (avance.escaneados === 0) {
    return `Te faltan ${avance.minimo_premio} stands para desbloquear tu regalo.`;
  }
  return fraseMotivacional(avance.escaneados, avance.minimo_premio);
}

function fraseMotivacional(escaneados: number, minimo: number): string {
  const faltan = minimo - escaneados;
  if (faltan < 0) return "¡Seguí descubriendo! Tu regalo ya está asegurado.";
  if (faltan === 0) return "¡Lo lograste! Pasá por el stand de premios a retirar tu regalo.";
  if (faltan === 1) return "Estás a un stand de conseguir tu regalo.";
  if (escaneados === 1) return "¡Arrancaste! Tu recorrido ya empezó.";
  if (escaneados * 2 >= minimo) return "¡Ya pasaste la mitad! Seguí así.";
  return "¡Bien! Vas por buen camino.";
}

export const PEDIR_DNI_EN_ENTREGA = false;

/** Bajada del título del juego. */
export const subtituloEvento = (minimo: number) =>
  `Escaneá el QR de ${minimo} stands y llevate un regalo sorpresa.`;

/** Bajada de la lista de stands. */
export const textoStandsParaDescubrir = (minimo: number, total: number) =>
  `Elegí ${minimo} de los ${total} stands para completar el desafío.`;

const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

/** Estado y textos de la tarjeta del premio. */
export function premioCopy(avance: PortalAvanceEvento): {
  estado: "bloqueado" | "habilitado" | "entregado";
  title: string;
  text: string;
} {
  if (avance.premio_entregado) {
    return { estado: "entregado", title: "Regalo entregado", text: "¡Gracias por participar!" };
  }
  if (avance.puede_retirar) {
    return {
      estado: "habilitado",
      title: avance.completo ? "¡Completaste todos los stands!" : "¡Tu regalo está listo!",
      text: "Acercate al stand de premios y mostrá esta pantalla.",
    };
  }
  return {
    estado: "bloqueado",
    title: "Tu regalo te espera",
    text: "Completá el recorrido para habilitarlo.",
  };
}

/** Pasos de "Cómo funciona" según las reglas del evento. */
export const pasosComoFunciona = (minimo: number) => [
  { titulo: "Buscá el QR", texto: "Cada stand tiene su código QR a la vista." },
  { titulo: "Escanealo", texto: "Abrí el escáner, apuntá la cámara y esperá el tilde." },
  {
    titulo: "Retirá tu regalo",
    texto: `Con ${minimo} ${plural(minimo, "stand", "stands")} escaneados, canjealo en el stand de premios.`,
  },
];

/** DNI que carga el personal al entregar: entre 6 y 9 dígitos sin contar ceros adelante. */
export const dniValido = (dni: string) => /^d{6,9}$/.test(dni.replace(/^0+/, ""));

/** Página de bases y condiciones del juego. */
export const BASES_EVENTO_URL = "/evento/bases";

/** Texto para el cliente según el código de error del backend (sin jerga técnica). */
export function mensajeErrorEvento(code: string | null | undefined): string {
  switch (code) {
    case "EVENTO_STANDS_INACTIVO":
      return "El juego de stands no está disponible en este momento.";
    case "EVENTO_STANDS_CODIGO_INVALIDO":
      return "No reconocimos este código. Probá escanear de nuevo el QR del stand.";
    case "EVENTO_STANDS_INCOMPLETO":
      return "Todavía te faltan stands por escanear para retirar el regalo.";
    case "EVENTO_STANDS_PIN_INVALIDO":
      return "El PIN no es correcto.";
    case "EVENTO_STANDS_TERMINOS_PENDIENTES":
      return "Para jugar, primero aceptá las bases y condiciones.";
    case "EVENTO_STANDS_DNI_INVALIDO":
      return "Revisá el DNI: tiene que tener solo números.";
    case "EVENTO_STANDS_DNI_YA_RETIRO":
      return "Ese DNI ya retiró su regalo.";
    case "EVENTO_STANDS_PIN_BLOQUEADO":
      return "Se ingresó mal el PIN varias veces. Esperá unos minutos y volvé a intentar.";
    default:
      return "No pudimos completar la acción. Probá de nuevo en un momento.";
  }
}

export const leerCodigoError = (data: unknown): string | null => {
  if (typeof data !== "object" || data === null) return null;
  const code = (data as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
};
