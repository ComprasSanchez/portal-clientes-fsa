export type PortalColaboradorResponse = {
  es_colaborador: boolean;
};

export type PortalVentasColaboradorDia = {
  /** YYYY-MM-DD */
  fecha: string;
  total: number;
  particular: number;
  obra_social: number;
  pami: number;
  tickets: number;
};

export type PortalVentasColaboradorResponse = {
  desde: string;
  hasta: string;
  resumen: {
    total: number;
    particular: number;
    obra_social: number;
    pami: number;
    tickets: number;
    ticket_promedio: number | null;
    dias_con_ventas: number;
  };
  dias: PortalVentasColaboradorDia[];
};
