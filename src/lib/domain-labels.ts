export const SEND_TYPE_LABELS = {
  RETIRA_SUCURSAL: "Retira en la sucursal",
  ENVIO_DOMICILIO: "Envio a domicilio",
} as const;

export const TIME_CONTACT_LABELS = {
  MAÑANA: "Solo mañana",
  MANANA: "Solo mañana",
  TARDE: "Solo tarde",
  "": "Mañana o tarde (indistinto)",
} as const;

export const PAY_TYPE_LABELS = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  OBRA_SOCIAL: "Obra social",
  CUENTA_CORRIENTE: "Cuenta corriente",
} as const;

export const CICLOS_STATE_TYPE_LABELS = {
  PENDIENTE: "PENDIENTE",
  EN_GESTION: "EN GESTIÓN",
  HECHO: "COMPLETADO",
} as const;

export const formatFriendlyLabel = (value: string | null | undefined) => {
  if (!value) {
    return "Sin dato";
  }

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const formatContactLabel = (value: string | null | undefined) => {
  const normalized = value?.toUpperCase();

  if (normalized === "TELEFONO") {
    return "Teléfono";
  }

  if (normalized === "EMAIL") {
    return "Correo electrónico";
  }

  if (normalized === "WHATSAPP") {
    return "WhatsApp";
  }

  return formatFriendlyLabel(value);
};

export const getMappedLabel = (
  labels: Record<string, string>,
  value: string | null | undefined,
) => {
  if (value == null) {
    return "Sin dato";
  }

  return labels[value] ?? formatFriendlyLabel(value);
};