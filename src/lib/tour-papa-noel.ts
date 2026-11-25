// Tour de Papá Noel: textos y cálculos de la pantalla (sin UI).
import type { Sucursal } from "@/types/sucursal";
import type { TourEstado, TourEstadoParada, TourParada, TourPapaNoel } from "@/types/portal-tour-papa-noel";

const ZONA_HORARIA = "America/Argentina/Cordoba";

export const PAPA_NOEL_IMAGEN = "/fin-de-anio/papa-noel.webp";

/** Parada con los datos de la sucursal (nombre, dirección y ubicación) ya resueltos. */
export type ParadaConSucursal = TourParada & { datos: Sucursal | null };

const partes = (iso: string) => {
  const p = new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_HORARIA,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const v = (t: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === t)?.value ?? "";
  return { dia: v("weekday"), fecha: `${v("day")}/${v("month")}`, hora: `${v("hour")}:${v("minute")}` };
};

/** "Miércoles 16/12 13:00 a 15:00 hs" */
export function horarioParada(parada: Pick<TourParada, "inicio" | "fin">): string {
  const i = partes(parada.inicio);
  const f = partes(parada.fin);
  const dia = i.dia.charAt(0).toUpperCase() + i.dia.slice(1);
  return `${dia} ${i.fecha} ${i.hora} a ${f.hora} hs`;
}

export const nombreParada = (p: ParadaConSucursal) => `Sucursal N° ${p.sucursal}`;

/** Suma los datos de cada sucursal por su número. */
export function conSucursales(paradas: TourParada[], sucursales: Sucursal[]): ParadaConSucursal[] {
  return paradas.map((p) => ({ ...p, datos: sucursales.find((s) => s.codigo === p.sucursal) ?? null }));
}

/** La parada que se destaca: la de ahora o la próxima. */
export const paradaDestacada = (paradas: ParadaConSucursal[]) =>
  paradas.find((p) => p.estado === "AHORA") ?? paradas.find((p) => p.estado === "PROXIMA") ?? null;

export const PILDORA_ESTADO: Record<TourEstado, string> = {
  SIN_RECORRIDO: "Muy pronto",
  NO_ARRANCO: "Todavía no arrancó",
  EN_PARADA: "¡Está acá ahora!",
  EN_CAMINO: "En camino",
  TERMINO: "¡Gracias por venir!",
};

export const PILDORA_PARADA: Record<TourEstadoParada, string> = {
  YA_PASO: "Ya pasó",
  AHORA: "Ahora",
  PROXIMA: "Próxima",
  SIGUE: "Sigue",
};

/** Texto de la tarjeta de arriba según el momento del tour. */
export function textoEstado(tour: TourPapaNoel, destacada: ParadaConSucursal | null): string {
  const donde = destacada ? `${nombreParada(destacada)}, ${horarioParada(destacada)}` : "";
  switch (tour.estado) {
    case "NO_ARRANCO":
      return `Primera parada: ${donde}`;
    case "EN_PARADA":
      return `Está en la ${donde}. ¡Vení a sacarte la foto!`;
    case "EN_CAMINO":
      return `Va camino a la ${donde}`;
    case "TERMINO":
      return "Papá Noel ya terminó su recorrido. ¡Gracias por acompañarlo!";
    default:
      return "Muy pronto vas a ver acá el recorrido de Papá Noel por nuestras sucursales.";
  }
}

export type PuntoMapa = { orden: number; lat: number; lng: number; destacada: boolean };

/** Paradas que se pueden dibujar (con ubicación), en el orden del recorrido. */
export const puntosDelMapa = (paradas: ParadaConSucursal[], destacada: number | null): PuntoMapa[] =>
  paradas.flatMap((p) =>
    p.datos ? [{ orden: p.orden, lat: p.datos.lat, lng: p.datos.lng, destacada: p.orden === destacada }] : [],
  );

/**
 * Por dónde va Papá Noel medido en paradas del mapa: 0 = primera, 1.5 = mitad
 * entre la segunda y la tercera. null si no se puede ubicar.
 */
export function avancePapaNoel(tour: TourPapaNoel, puntos: PuntoMapa[]): number | null {
  const u = tour.ubicacion;
  if (!u || !puntos.length) return null;
  const desde = puntos.findIndex((p) => p.orden === u.desde);
  const hasta = puntos.findIndex((p) => p.orden === u.hasta);
  if (desde < 0 && hasta < 0) return null;
  if (desde < 0 || hasta < 0) return Math.max(desde, hasta);
  return desde + (hasta - desde) * u.progreso;
}

/** Latitud y longitud de un avance (interpola entre las dos paradas vecinas). */
export function puntoDelAvance(puntos: PuntoMapa[], avance: number): { lat: number; lng: number } {
  const i = Math.max(0, Math.min(puntos.length - 1, Math.floor(avance)));
  const j = Math.min(puntos.length - 1, i + 1);
  const t = Math.max(0, Math.min(1, avance - i));
  return {
    lat: puntos[i].lat + (puntos[j].lat - puntos[i].lat) * t,
    lng: puntos[i].lng + (puntos[j].lng - puntos[i].lng) * t,
  };
}
