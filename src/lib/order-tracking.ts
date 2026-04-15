export type ParentOrder = {
  id: string;
  code?: string | null;
  status?: string | null;
  orders?: Array<{
    nroPedido?: string | null;
    pedidoEstadoDescripcion?: string | null;
    movements?: Array<{
      idEstado?: number;
      estadoNombre?: string;
      fecha?: string;
    }>;
  }>;
};

export type TrackingOrderStatus =
  | "pendiente"
  | "aceptado"
  | "confirmado"
  | "en_preparacion"
  | "listo_para_envio"
  | "en_camino"
  | "entregado";

export const TRACKING_STATUS_SEQUENCE: TrackingOrderStatus[] = [
  "pendiente",
  "aceptado",
  "confirmado",
  "en_preparacion",
  "listo_para_envio",
  "en_camino",
  "entregado",
];

export const getTrackingStatus = (parentOrder: ParentOrder): TrackingOrderStatus => {
  if (parentOrder.status === "ACCEPTED") {
    return "aceptado";
  }

  if (parentOrder.status === "CONFIRMED") {
    return "confirmado";
  }

  if (parentOrder.status === "IN_PREPARATION") {
    return "en_preparacion";
  }

  if (parentOrder.status === "PREPARED" || parentOrder.status === "PREPARED_PARTIAL") {
    return "listo_para_envio";
  }

  let highestChildStatus = 0;
  parentOrder.orders?.forEach((order) => {
    const lastMovement = order.movements?.[0];
    if ((lastMovement?.idEstado ?? 0) > highestChildStatus) {
      highestChildStatus = lastMovement?.idEstado ?? 0;
    }
  });

  if (highestChildStatus === 7) {
    return "entregado";
  }

  if (highestChildStatus === 6) {
    return "en_camino";
  }

  if (highestChildStatus === 4 || highestChildStatus === 5) {
    return "listo_para_envio";
  }

  return "pendiente";
};

export const TRACKING_LABELS: Record<TrackingOrderStatus, string> = {
  pendiente: "Pendiente de gestión",
  aceptado: "Pedido aceptado",
  confirmado: "Pedido confirmado",
  en_preparacion: "En preparación",
  listo_para_envio: "Listo para entrega o retiro",
  en_camino: "En camino",
  entregado: "Entregado",
};

export const PARENT_ORDER_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "Aceptado",
  CONFIRMED: "Confirmado",
  IN_PREPARATION: "En preparación",
  PREPARED_PARTIAL: "Preparado parcial",
  PREPARED: "Preparado",
  CANCELLED: "Cancelado",
  REJECTED: "Rechazado",
};