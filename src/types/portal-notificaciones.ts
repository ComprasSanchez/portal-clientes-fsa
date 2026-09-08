export type PortalNotificacionItem = {
  id: string;
  channel: string;
  status: string;
  title?: string;
  body?: string;
  source?: string;
  kind?: string;
  createdAt: string;
  /** Si viene, la campanita navega ahí al hacer clic (ej. link de portal con token). */
  actionUrl?: string;
  /** Programa/marca (CORA, SOCIOSA, PROMOCIONES, BREVE, FARMA) — agrupa la notificación en la pantalla mobile. */
  category?: string;
};

export type PortalNotificacionesResponse = {
  items: PortalNotificacionItem[];
  total?: number;
};
