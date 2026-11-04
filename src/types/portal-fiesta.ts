// Fiesta de fin de año de colaboradores (temporal). Contrato del BFF (snake_case).

export type PortalFiestaMovimiento = {
  tipo: string;
  puntos: number;
  actividad_id: string | null;
  detalle: string | null;
  created_at: string;
};

export type PortalFiestaActividad = {
  id: string;
  nombre: string;
  modo: string;
  puntos: number;
  bonus_ganador: number;
};

export type PortalFiestaPremio = {
  id: string;
  nombre: string;
  /** A (chicos) · B · C · D (top, uno por persona). */
  nivel: string;
  puntos: number;
  disponibles: number;
};

export type PortalMiFiesta = {
  evento_id: string;
  asistencia: {
    ingreso_at: string;
    turno: 1 | 2;
    puntual: boolean;
    credencial_token: string;
    /** pendiente | tomada | impresa | error */
    impresion: string | null;
  } | null;
  saldo: number;
  movimientos: PortalFiestaMovimiento[];
  actividades: PortalFiestaActividad[];
  premios: PortalFiestaPremio[];
};
