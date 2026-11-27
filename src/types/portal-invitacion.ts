/** Invitación a "Dosis de Conexión" (médicos, farmacéuticos y visitadores). Viene de cronicos vía BFF. */
export type PortalMiInvitacion = {
  /** La sección está prendida. */
  activo: boolean;
  /** null: no está en la lista (no se muestra la sección). */
  invitado: {
    nombre: string | null;
    perfil: "medico" | "farmaceutico" | "visitador" | string;
    /** El QR de ingreso se muestra recién cuando lo prenden (el día del evento). */
    qr_visible: boolean;
    credencial_token: string | null;
    ingreso_at: string | null;
    /** Solo después de acreditarse en la puerta. */
    regalo: "pendiente" | "entregado" | null;
    regalo_at: string | null;
    /** Cuenta de Dr. Call: médicos como médico; farmacéuticos y visitadores como paciente. */
    drcall?: { tipo: "medico" | "paciente"; activa: boolean };
  } | null;
};

export type SexoDrCall = "MASCULINO" | "FEMENINO" | "OTRO";

/** La tarjeta "Tu cuenta de Dr. Call" de Dosis de Conexión. */
export type PortalCuentaDrCall = {
  tipo: "medico" | "paciente";
  activa: boolean;
  activa_at: string | null;
  datos: {
    nombre: string | null;
    apellido: string | null;
    email: string | null;
    telefono: string | null;
    sexo: SexoDrCall | null;
    fecha_nacimiento: string | null;
  };
  /** Lo que falta para activar: nombre, apellido, email, telefono, sexo, fecha_nacimiento, matricula, especialidad_id. */
  faltan: string[];
  /** Catálogo SISA, solo médicos. */
  especialidades: Array<{ id: string; nombre: string }> | null;
};

/** Lo que se manda al tocar "Activar" (completa o corrige la ficha). */
export type ActivarCuentaDrCallBody = {
  email?: string;
  telefono?: string;
  sexo?: SexoDrCall;
  fechaNacimiento?: string;
  matricula?: number;
  especialidadId?: string;
};
