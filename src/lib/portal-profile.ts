import type {
  PortalPerfilAfiliacion,
  PortalPerfilContacto,
  PortalPerfilDetails,
  PortalPerfilDomicilio,
  PortalPerfilResponse,
  PortalPerfilSummary,
} from "@/types/portal-profile";

const normalizeText = (value?: string | null) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const pickPreferredContacto = (
  contactos: PortalPerfilContacto[] | undefined,
  tipo: "EMAIL" | "TELEFONO",
) => {
  const candidates = Array.isArray(contactos)
    ? contactos.filter((contacto) => contacto.tipo === tipo)
    : [];

  return candidates.find((contacto) => contacto.principal) ?? candidates[0] ?? null;
};

const pickPreferredAfiliacion = (afiliaciones: PortalPerfilAfiliacion[] | undefined) => {
  const candidates = Array.isArray(afiliaciones) ? afiliaciones : [];

  return (
    candidates.find((afiliacion) => afiliacion.principal && afiliacion.vigente) ??
    candidates.find((afiliacion) => afiliacion.principal) ??
    candidates.find((afiliacion) => afiliacion.vigente) ??
    candidates[0] ??
    null
  );
};

const pickPreferredDomicilio = (domicilios: PortalPerfilDomicilio[] | undefined) => {
  const candidates = Array.isArray(domicilios) ? domicilios : [];

  return candidates.find((domicilio) => domicilio.principal) ?? candidates[0] ?? null;
};

const formatDate = (value?: string | null) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "Sin dato";
  }

  const plainDateMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plainDateMatch) {
    const [, year, month, day] = plainDateMatch;
    const localDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    );

    if (!Number.isNaN(localDate.getTime())) {
      return new Intl.DateTimeFormat("es-AR").format(localDate);
    }
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  return new Intl.DateTimeFormat("es-AR").format(date);
};

const formatAddress = (domicilio: PortalPerfilDomicilio | null) => {
  if (!domicilio) {
    return "Sin dato";
  }

  const street = [
    normalizeText(domicilio.calle),
    normalizeText(domicilio.numero),
    normalizeText(domicilio.piso) ? `Piso ${normalizeText(domicilio.piso)}` : null,
    normalizeText(domicilio.depto) ? `Dpto ${normalizeText(domicilio.depto)}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const location = [normalizeText(domicilio.ciudad), normalizeText(domicilio.provincia)]
    .filter(Boolean)
    .join(", ");

  return street || location || normalizeText(domicilio.etiqueta) || "Sin dato";
};

export const getPortalDisplayName = (perfil: PortalPerfilResponse | null | undefined) => {
  const nombre = normalizeText(perfil?.nombre);
  const apellido = normalizeText(perfil?.apellido);
  const razonSocial = normalizeText(perfil?.razonSocial);
  const customerCode = normalizeText(perfil?.customerCode);
  const fullName = [nombre, apellido].filter(Boolean).join(" ");

  return fullName || razonSocial || customerCode || "Usuario";
};

export const getPortalPerfilSummary = (
  perfil: PortalPerfilResponse | null | undefined,
): PortalPerfilSummary => {
  const afiliacion = pickPreferredAfiliacion(perfil?.afiliaciones);
  const email = pickPreferredContacto(perfil?.contactos, "EMAIL");
  const phone = pickPreferredContacto(perfil?.contactos, "TELEFONO");

  return {
    displayName: getPortalDisplayName(perfil),
    affiliateNumber: normalizeText(afiliacion?.nroAfiliado),
    documentNumber: normalizeText(perfil?.documento?.numero),
    email: normalizeText(email?.valor),
    phone: normalizeText(phone?.valor),
  };
};

export const getPortalPerfilDetails = (
  perfil: PortalPerfilResponse | null | undefined,
): PortalPerfilDetails => {
  const summary = getPortalPerfilSummary(perfil);
  const domicilio = pickPreferredDomicilio(perfil?.domicilios);

  return {
    ...summary,
    birthDate: formatDate(perfil?.fechaNacimiento),
    legalAddress: formatAddress(domicilio),
    residenceAddress: formatAddress(domicilio),
  };
};