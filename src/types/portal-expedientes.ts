export type PortalExpedienteCycle = {
  cicloId: string;
  numeroCiclo: number;
  titulo: string;
  estado: string;
  fechaInicioCiclo: string;
  fechaEntregaObjetivo: string;
  fechaInicioGestion: string;
  updatedAt: string;
};

export type PortalExpedienteItem = {
  expedienteId: string;
  titulo?: string;
  estado: string;
  categoria?: string;
  contactoId?: string | null;
  afiliacionOSId?: string | null;
  medioEntrega?: string | null;
  domicilioEntregaId?: string | null;
  sucursalEntregaId?: number | null;
  medioPago?: string | null;
  openedAt?: string;
  updatedAt?: string;
  nextActionAt?: string;
  cicloActual?: PortalExpedienteCycle;
  ciclosPasados?: PortalExpedienteCycle[];
};

export type PortalExpedientesResponse = {
  schemaVersion: "v1";
  generatedAt: string;
  partial: boolean;
  warnings: string[];
  data: {
    clienteId: string;
    resumen: {
      total: number;
      activos: number;
      cerrados: number;
    };
    items: PortalExpedienteItem[];
    page: {
      offset: number;
      limit: number;
      hasMore: boolean;
    };
  };
};