export type PortalProductoRaw = {
  id?: string | number;
  nombre?: string;
  productoNombre?: string;
  lab?: string;
  marcaNombre?: string;
  presentacion?: string;
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
};
