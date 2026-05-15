export type PortalPuntosSaldo = {
  disponibles?: number;
  pendientes?: number;
  porVencer30d?: number;
};

export type PortalPuntosMovimiento = Record<string, unknown>;

export type PortalPuntosPage = {
  page?: number;
  limit?: number;
  hasMore?: boolean;
};

export type PortalPuntosData = {
  clienteId?: string;
  saldo?: PortalPuntosSaldo;
  movimientos?: PortalPuntosMovimiento[];
  page?: PortalPuntosPage;
};

export type PortalPuntosResponse = {
  schemaVersion?: string;
  generatedAt?: string;
  partial?: boolean;
  warnings?: string[];
  data?: PortalPuntosData;
};

export type PortalPuntosSummary = {
  disponibles: number;
  pendientes: number;
  porVencer30d: number;
  partial: boolean;
  warnings: string[];
};