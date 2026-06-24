export type PortalSucursalOption = {
  id: number;
  nombre: string;
  direccion: string;
  telefono?: string | null;
  empresa_id?: number;
  formato_id?: number;
  cod_sucursal?: number;
  latitud?: number | null;
  longitud?: number | null;
  tolerancia_metros?: number | null;
};

export type PortalSucursalesResponse =
  | PortalSucursalOption[]
  | {
      sucursales?: PortalSucursalOption[];
      items?: PortalSucursalOption[];
      data?: PortalSucursalOption[];
    };

export type PortalHorarioSucursalItem = {
  id: number;
  sucursal_id: number;
  dia_id: number;
  hora_apertura: string;
  hora_cierre: string;
};
