export type Sucursal = {
  id: string;
  nombre: string;
  direccion: string;
  barrio?: string;
  ciudad: string;
  provincia: string;
  telefono?: string;
  whatsapp?: string;
  horarios?: string;
  lat: number;
  lng: number;
  servicios?: string[];
  activa: boolean;
};

export type SucursalWithDistance = Sucursal & { distance: number | null };
