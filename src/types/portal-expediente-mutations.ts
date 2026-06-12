export type PortalExpedienteItemInput = {
  productoIdOrSkuExt?: string;
  productoNombre?: string;
  marcaNombre?: string;
  activo?: boolean;
  periodoDias?: number;
  diaMesPreferido?: number;
  unidadesPorEnvase?: number;
  dosisPorToma?: number;
  tomasPorDia?: number;
  cantidadEnvasesPorCiclo?: number;
};

export type PortalCreateExpedienteRequest = {
  titulo: string;
  afiliacionOSId?: string | null;
  contactoId?: string | null;
  domicilioEntregaId?: string | null;
  sucursalEntregaId?: number | null;
  anticipacionDias?: number;
  politicaContacto?: string | null;
  preferenciaContacto?: string | null;
  cadenciaDiasDefault?: number | null;
  diaMesPreferidoDefault?: number | null;
  medioEntrega?: string | null;
  medioPago?: string | null;
  fechaInicioCicloBase?: string | null;
  proximaFechaEntregaForzada?: string | null;
  medicoId?: string | null;
  items?: PortalExpedienteItemInput[];
};

export type PortalUpdateExpedienteRequest = {
  titulo?: string;
  afiliacionOSId?: string | null;
  contactoId?: string | null;
  domicilioEntregaId?: string | null;
  sucursalEntregaId?: number | null;
  anticipacionDias?: number | null;
  politicaContacto?: string | null;
  preferenciaContacto?: string | null;
  cadenciaDiasDefault?: number | null;
  diaMesPreferidoDefault?: number | null;
  medioEntrega?: string | null;
  medioPago?: string | null;
  proximaFechaEntregaForzada?: string | null;
  medicoId?: string | null;
};

export type PortalCreateExpedienteResponse = {
  expedienteId: string;
  items?: Array<{ itemId: string }>;
  cicloId?: string;
  eventoInicialId?: string;
};
