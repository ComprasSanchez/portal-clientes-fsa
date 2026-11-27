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
  } | null;
};
