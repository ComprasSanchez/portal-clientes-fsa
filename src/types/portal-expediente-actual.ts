export type PortalExpedienteActualCadencia = {
  tipo: string;
  valor: number;
};

export type PortalExpedienteActualDocumento = {
  tipo: string;
  numero: string;
};

export type PortalExpedienteActualCliente = {
  id: string;
  customerCode: string;
  version: number;
  tipoCliente: string;
  documento: PortalExpedienteActualDocumento;
  nombre: string;
  apellido: string;
  razonSocial: string | null;
  sexo: string | null;
  fechaNacimiento: string | null;
  estado: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type PortalExpedienteActualContacto = {
  id: string;
  tipo: string;
  valor: string;
  principal: boolean;
  verificado: boolean;
  fechaVerificacion: string | null;
};

export type PortalExpedienteActualDomicilioEntrega = {
  id: string;
  calle: string | null;
  numero: string | null;
  piso: string | null;
  departamento: string | null;
  localidad: string | null;
  provincia: string | null;
  codigoPostal: string | null;
  referencia: string | null;
  observaciones: string | null;
};

export type PortalExpedienteActualMedico = {
  id: string;
  nombre: string;
  matricula: string | null;
  especialidad: string | null;
};

export type PortalExpedienteActualSucursalEntrega = {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string | null;
  empresa_id: number;
  formato_id: number;
  cod_sucursal: number;
  latitud: number | null;
  longitud: number | null;
  tolerancia_metros: number | null;
};

export type PortalExpedienteActualExpedienteItem = {
  id: string;
  expedienteId: string;
  clienteId: string;
  itemCatalogoId: string;
  productoNombre: string;
  marcaNombre: string | null;
  periodoDias: number;
  proximaEstimacion: string | null;
  activo: boolean;
  snapshot: unknown | null;
  notas: string | null;
  unidadesPorEnvase: number | null;
  dosisPorToma: number | null;
  tomasPorDia: number | null;
  cantidadEnvasesPorCiclo: number | null;
  lastDispensedAt: string | null;
  lastDispensedCycleId: string | null;
  lastDispensedUnits: number | null;
  backlogUnits: number | null;
  cadencia: PortalExpedienteActualCadencia;
  cadenciaDias: number | null;
  diaMesPreferido: number | null;
  diasCoberturaEstimados: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PortalExpedienteActualExpediente = {
  id: string;
  clienteId: string;
  titulo: string;
  estado: string;
  afiliacionOSId: string | null;
  contactoId: string | null;
  domicilioEntregaId: string | null;
  sucursalEntregaId: number | null;
  contactoOverride: unknown | null;
  domicilioEntregaOverride: unknown | null;
  medioEntrega: string | null;
  medioPago: string | null;
  anticipacionDias: number | null;
  politicaContacto: string | null;
  cadenciaDiasDefault: number | null;
  diaMesPreferidoDefault: number | null;
  createdAt: string;
  updatedAt: string;
  fechaInicioCicloBase: string | null;
  proximaFechaEntregaForzada: string | null;
  medicoId: string | null;
  medicoNombre: string | null;
  items: PortalExpedienteActualExpedienteItem[];
};

export type PortalExpedienteActualCycle = {
  id: string;
  expedienteId: string;
  numeroCiclo: number;
  titulo: string;
  estado: string;
  estadoDerivado: string | null;
  fechaInicioCiclo: string;
  fechaEntregaObjetivo: string;
  fechaInicioGestion: string | null;
  medioEntrega: string | null;
  medioPago: string | null;
  domicilioSnapshot: unknown | null;
  sucursalEntregaSnapshot: unknown | null;
  pedidos: unknown[];
  updatedAt: string;
};

export type PortalExpedienteActualCycleEvent = {
  id: string;
  cicloId: string;
  expedienteId: string;
  tipo: string;
  titulo: string;
  descripcionOperador: string | null;
  medioContacto: string | null;
  fechaProgramada: string | null;
  horaProgramada: string | null;
  fechaCompletado: string | null;
  estado: string;
  estadoEventoAnterior: string | null;
  updatedAt: string;
};

export type PortalExpedienteActualCycleItem = {
  id: string;
  cicloId: string;
  expedienteId: string;
  treatmentItemId: string;
  productId: string;
  productoNombre: string;
  periodoDias: number | null;
  activo: boolean;
  plannedUnits: number;
  dispensedUnits: number;
  kind: string;
  status: string;
  note: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PortalExpedienteActualCycleEnvelope = {
  ciclo: PortalExpedienteActualCycle;
  eventos: PortalExpedienteActualCycleEvent[];
  items: PortalExpedienteActualCycleItem[];
};

export type PortalExpedienteActualDetalle = {
  expediente: PortalExpedienteActualExpediente;
  cliente: PortalExpedienteActualCliente;
  afiliacionOS: unknown | null;
  contacto: PortalExpedienteActualContacto | null;
  domicilioEntrega: PortalExpedienteActualDomicilioEntrega | null;
  sucursalEntrega: PortalExpedienteActualSucursalEntrega | null;
  medico: PortalExpedienteActualMedico | null;
  cicloActual: PortalExpedienteActualCycleEnvelope | null;
  ciclosPasados: PortalExpedienteActualCycle[];
};

export type PortalExpedienteActualData = {
  clienteId: string;
  expedienteId: string;
  detalle: PortalExpedienteActualDetalle;
};

export type PortalExpedienteActualResponse = {
  schemaVersion: string;
  generatedAt: string;
  partial: boolean;
  warnings: string[];
  data: PortalExpedienteActualData;
};