export type PortalComprasResumen = {
  totalCompras?: number;
  montoAcumulado?: number;
  moneda?: string;
};

export type PortalComprasProducto = {
  detalle?: string;
  cantidad?: number;
  total?: number;
  cobertura?: number;
  coberturaPorcentaje?: number;
  descuento?: number;
  descuentoPorcentaje?: number;
  recargoPorcentaje?: number;
};

export type PortalComprasItem = {
  cliente?: string;
  telefono?: string;
  dni?: string;
  compraId?: string;
  fecha?: string;
  emision?: string;
  hora?: string;
  estado?: string;
  anulado?: boolean;
  tipo?: string;
  letra?: string;
  puntoVta?: number | string;
  numero?: number | string;
  idComprobante?: number | string;
  sucursal?: number | string;
  nombreFantasia?: string;
  producto?: string;
  cantidad?: number;
  total?: number;
  moneda?: string;
  comprobanteRef?: string;
  productos?: PortalComprasProducto[];
};

export type PortalComprasPage = {
  offset?: number;
  limit?: number;
  hasMore?: boolean;
};

export type PortalComprasData = {
  clienteId?: string;
  resumen?: PortalComprasResumen;
  items?: PortalComprasItem[];
  page?: PortalComprasPage;
};

export type PortalComprasResponse = {
  schemaVersion?: string;
  generatedAt?: string;
  partial?: boolean;
  warnings?: string[];
  data?: PortalComprasData;
};

export type PortalCompraComprobante = {
  compraId: string;
  comprobanteRef: string;
  fecha: string | null;
  hora: string | null;
  nombreFantasia: string | null;
  estado: string | null;
  anulado: boolean;
  moneda: string;
  total: number;
  productos: PortalComprasProducto[];
  items: PortalComprasItem[];
};

export type PortalComprasSummary = {
  totalCompras: number;
  montoAcumulado: number;
  moneda: string;
  partial: boolean;
  warnings: string[];
  comprobantes: PortalCompraComprobante[];
  page: {
    offset: number;
    limit: number;
    hasMore: boolean;
  };
};