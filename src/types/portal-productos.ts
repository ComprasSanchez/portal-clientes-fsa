export type PortalProductoRaw = {
  id?: string | number;
  nombre?: string;
  productoNombre?: string;
  lab?: string;
  marcaNombre?: string;
  presentacion?: string;
  precio?: number | null;
  precioBase?: number | null;
  descuentoPct?: number;
};

export type PortalProductosResponse = {
  data?: PortalProductoRaw[] | PortalProductoRaw;
  meta?: {
    total?: number;
    paginanro?: number;
    paginacant?: number;
    totpaginas?: number;
  };
};

export type PortalProductoOption = {
  id: string;
  nombre: string;
  laboratorio: string;
  presentacion?: string;
  precio?: number | null;
  precioBase?: number | null;
  descuentoPct?: number;
};

export type SelectedProductState = PortalProductoOption & {
  periodoDias: string;
  cantidadEnvasesPorCiclo: number;
};

export type PortalProductoRecurrente = {
  id: string;
  nombre: string;
  vecesComprado?: number;
};

export type PortalProductosRecurrentesResponse = {
  data?: PortalProductoRecurrente[];
};
