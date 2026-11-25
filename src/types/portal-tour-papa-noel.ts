// Tour de Papá Noel: contrato de /api/portal/me/tour-papa-noel (eventos-back, camelCase).

export type TourEstadoParada = "YA_PASO" | "AHORA" | "PROXIMA" | "SIGUE";

export type TourEstado = "SIN_RECORRIDO" | "NO_ARRANCO" | "EN_PARADA" | "EN_CAMINO" | "TERMINO";

export type TourParada = {
  orden: number;
  /** Número de sucursal (`cod_sucursal`). */
  sucursal: string;
  inicio: string;
  fin: string;
  estado: TourEstadoParada;
};

/** Entre qué paradas (por `orden`) está Papá Noel y cuánto avanzó (0 a 1). */
export type TourUbicacion = { desde: number; hasta: number; progreso: number };

export type TourPapaNoel = {
  ahora: string;
  estado: TourEstado;
  paradas: TourParada[];
  ubicacion: TourUbicacion | null;
};
