import { normalizeText } from "@/lib/portal-profile";
import type {
  PortalPerfilAfiliacion,
  PortalPerfilContacto,
  PortalPerfilDomicilio,
} from "@/types/portal-profile";
import type { SelectedProductState } from "@/types/portal-productos";

export const DELIVERY_OPTIONS = [
  { value: "", label: "Seleccioná una forma de entrega" },
  { value: "ENVIO_DOMICILIO", label: "Envío a domicilio" },
  { value: "RETIRA_SUCURSAL", label: "Retira en sucursal" },
] as const;

export const PAYMENT_OPTIONS = [
  { value: "", label: "Seleccioná una forma de pago" },
  { value: "CUENTA_CORRIENTE", label: "Cuenta corriente" },
  { value: "OBRA_SOCIAL", label: "Obra social" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "EFECTIVO", label: "Efectivo" },
] as const;

export const toInputDate = (value?: string | null) => {
  const normalized = normalizeText(value);
  if (!normalized) return "";

  const plainDateMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
  if (plainDateMatch) {
    return plainDateMatch[1];
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString().slice(0, 10);
};

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const DEFAULT_ANTICIPACION_DIAS = 10;

export const subtractDaysFromIsoDate = (
  isoDate: string,
  days: number,
): string | null => {
  if (!isoDate) return null;

  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  parsed.setDate(parsed.getDate() - days);
  return parsed.toISOString().slice(0, 10);
};

export const formatExpedienteLabel = (expedienteId: string) => {
  const compact = expedienteId.replaceAll("-", "");
  return `Pedido ${compact.slice(0, 8).toUpperCase()}`;
};

export const DEFAULT_EXPEDIENTE_TITULO = "Pedido generado en CORA";

export const getAutoTitulo = (products: SelectedProductState[]) => {
  const firstProductName = normalizeText(products[0]?.nombre);
  return firstProductName ? `Pedido desde CORA - ${firstProductName}` : DEFAULT_EXPEDIENTE_TITULO;
};

export const getContactoLabel = (contacto: PortalPerfilContacto) => {
  const tipo = contacto.tipo === "EMAIL" ? "Email" : "Teléfono";
  const valor = normalizeText(contacto.valor) ?? "Sin dato";
  const suffix = contacto.verificado ? "Verificado" : "No verificado";

  return `${tipo}: ${valor} · ${suffix}`;
};

export const getAfiliacionLabel = (afiliacion: PortalPerfilAfiliacion) => {
  const obraSocial = normalizeText(afiliacion.obraSocialNombre) ?? "Obra social";
  const plan = normalizeText(afiliacion.planNombre);
  const nroAfiliado = normalizeText(afiliacion.nroAfiliado);
  const parts = [obraSocial, plan, nroAfiliado ? `N° ${nroAfiliado}` : null].filter(Boolean);

  return parts.join(" · ");
};

export const getDomicilioValue = (domicilio: PortalPerfilDomicilio) =>
  domicilio.id ??
  [domicilio.calle, domicilio.numero, domicilio.ciudad, domicilio.provincia]
    .filter(Boolean)
    .join("|");

export const getDomicilioLabel = (domicilio: PortalPerfilDomicilio) => {
  const street = [normalizeText(domicilio.calle), normalizeText(domicilio.numero)]
    .filter(Boolean)
    .join(" ");
  const locality = [normalizeText(domicilio.ciudad), normalizeText(domicilio.provincia)]
    .filter(Boolean)
    .join(", ");
  const label =
    [street, locality].filter(Boolean).join(" - ") ||
    normalizeText(domicilio.etiqueta) ||
    "Domicilio";

  return domicilio.principal ? `${label} - Principal` : label;
};
