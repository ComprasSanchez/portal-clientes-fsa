export type PedidoNormalizado = {
  id_pedido: string;
  fecha: string;
  id_estado: number;
  fecha_estado: string;
  email: string;
  tipo_documento: string;
  documento: string;
  nombre: string;
  domicilio: string;
  codigo_postal: string;
  telefono: string;
  tipo_entrega: string;
  tipo_pago: string;
  observacion: string;
  id_sucursal: number;
  referencia_pago: string;
  importe: number;
};

export type PedidosResponse = {
  pedidos: PedidoNormalizado[];
  total: number;
};

export const PLEX_ESTADO_LABELS: Record<number, string> = {
  1: "Pendiente",
  2: "Rechazado",
  3: "En preparación",
  4: "Listo para envío",
  5: "Listo para retiro",
  6: "En camino",
  7: "Entregado",
  8: "Pendiente de pago",
  9: "Pagado",
};

export const PLEX_TRACKING_STEPS: Array<{ label: string; threshold: number }> =
  [
    { label: "Pedido registrado", threshold: 1 },
    { label: "En preparación", threshold: 3 },
    { label: "Listo para entrega o retiro", threshold: 4 },
    { label: "En camino", threshold: 6 },
    { label: "Entregado", threshold: 7 },
  ];

// Estados 8 y 9 (pago) se muestran como entregado en el stepper
export const getDisplayEstado = (idEstado: number): number => {
  if (idEstado >= 8) return 7;
  return idEstado;
};

export const isTrackingStepActive = (
  threshold: number,
  idEstado: number,
): boolean => {
  if (idEstado === 2) return false;
  return getDisplayEstado(idEstado) >= threshold;
};
