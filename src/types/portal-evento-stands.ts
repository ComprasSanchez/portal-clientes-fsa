export type PortalEventoStand = {
  numero: number;
  nombre: string;
  escaneado: boolean;
  escaneado_at: string | null;
};

export type PortalAvanceEvento = {
  evento_id: string;
  total: number;
  escaneados: number;
  completo: boolean;
  /** Stands necesarios para retirar el premio. */
  minimo_premio: number;
  puede_retirar: boolean;
  premio_entregado: boolean;
  premio_entregado_at: string | null;
  /** Aceptó las bases y condiciones; sin esto no puede escanear. */
  terminos_aceptados: boolean;
  stands: PortalEventoStand[];
};

export type PortalEscaneoStandResponse = {
  stand_numero: number;
  avance: PortalAvanceEvento;
};
