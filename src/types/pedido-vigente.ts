export type EstadoPedidoVigente =
  | "PENDING_PAYMENT"
  | "ACCEPTED"
  | "CONFIRMED"
  | "IN_PREPARATION"
  | "PREPARED"
  | "IN_TRANSIT"
  | "DELIVERED";

export type PedidoVigenteApi = {
  ciclo_abierto: boolean;
  pedido: {
    codigo: string;
    estado: EstadoPedidoVigente;
    retira_en_sucursal: boolean | null;
    sucursal_nombre: string | null;
    fecha_entrega: string | null;
  } | null;
};

export type PedidoVigente = {
  codigo: string;
  estado: EstadoPedidoVigente;
  retiraEnSucursal: boolean | null;
  sucursalNombre: string | null;
  fechaEntrega: string | null;
};

export type PedidoVigenteRespuesta = {
  cicloAbierto: boolean;
  pedido: PedidoVigente | null;
};
