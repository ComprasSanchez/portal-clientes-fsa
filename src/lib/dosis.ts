// "Dosis de Conexión" (fiesta de médicos, farmacéuticos y visitadores). Datos fijos del evento.

export const DOSIS = {
  nombre: "Dosis de Conexión",
  bajada: "una noche para vos",
  fecha: "04 de diciembre",
  hora: "21 hs",
  lugar: "Driving de Villa Allende",
  /** Link que pasó la organización ("Cómo llegar"). */
  mapsUrl: "https://maps.app.goo.gl/gnphUUvcuTURoA1G9",
  /** El link corto no se puede embeber: el mapa busca el lugar por nombre. */
  mapsEmbed: "https://www.google.com/maps?q=Driving+de+Villa+Allende,+C%C3%B3rdoba&output=embed",
} as const;

/** Logos de sponsors (vacío = no se muestra el bloque). */
export const DOSIS_SPONSORS: Array<{ nombre: string; logo: string; url?: string }> = [];

const PERFILES: Record<string, string> = {
  medico: "Médico/a",
  farmaceutico: "Farmacéutico/a",
  visitador: "Visitador/a médico/a",
};
export const perfilLegible = (perfil: string) => PERFILES[perfil] ?? perfil;

export const horaCorta = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
