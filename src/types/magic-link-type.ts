export type Product = {
  id: string;
  nombre: string;
  lab: string;
  rubro?: string;
  presentacion?: string;
};

export type ItemRecurrenteDetalle = {
  id: string;
  cicloId: string;
  expedienteId: string;
  treatmentItemId: string;
  productId: string;
  plannedUnits: number;
  dispensedUnits: number;
  periodoDias: number;
  kind: string;
  status: string;
  note: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  productoNombre: string | null;
  marcaNombre: string | null;
  activo: boolean | null;
};

export type ItemDetalleNotInCycle = {
  id: string;
  expedienteId: string;
  clienteId: string;
  itemCatalogoId: string;
  productoNombre: string;
  marcaNombre: string;
  periodoDias: number;
  proximaEstimacion: string;
  activo: boolean;
  cadencia: {
    tipo: string;
    valor: number;
  };
  unidadesPorEnvase: number | null;
  dosisPorToma: number | null;
  tomasPorDia: number | null;
  diasCoberturaEstimados: number | null;
  lastDispensedAt: string | null;
  lastDispensedCycleId: string | null;
  lastDispensedUnits: unknown | null;
  backlogUnits: unknown | null;
  createdAt: string;
  updatedAt: string;
  notInCycle: boolean;
};

export type ItemRecurrente = {
  cicloItems: ItemRecurrenteDetalle[];
  treatmentItemsNotInCycle: ItemDetalleNotInCycle[];
};

export type DecodedToken = {
  expedienteId: string;
  clienteId: string;
  cicloId?: string;
  type: string;
  iat: number;
  exp: number;
};

export type Domicilio = {
  id: string;
  etiqueta: string;
  calle: string;
  numero?: string;
  piso?: string | null;
  depto?: string | null;
  referencia?: string | null;
  ciudad?: string;
  provincia?: string;
  codPostal?: string | null;
  pais?: string;
  principal?: boolean;
};

export type Sucursal = {
  id: number | string;
  nombre: string;
  direccion: string;
  telefono?: string;
};

export type OccasionalAddress = {
  calle: string;
  numero: string;
  cp: string;
  ciudad: string;
  provincia: string;
  pais: string;
  referencia: string;
};
