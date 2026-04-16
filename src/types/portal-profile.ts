export type PortalPerfilContacto = {
  id?: string;
  tipo?: "EMAIL" | "TELEFONO" | string;
  valor?: string;
  regionIso2?: string | null;
  principal?: boolean;
  verificado?: boolean;
  fechaVerificacion?: string | null;
};

export type PortalPerfilAfiliacion = {
  id?: string;
  nroAfiliado?: string | null;
  titular?: boolean;
  principal?: boolean;
  vigente?: boolean;
};

export type PortalPerfilDomicilio = {
  id?: string;
  etiqueta?: string | null;
  calle?: string;
  numero?: string | null;
  piso?: string | null;
  depto?: string | null;
  referencia?: string | null;
  ciudad?: string;
  provincia?: string;
  codPostal?: string | null;
  pais?: string | null;
  lat?: number | null;
  long?: number | null;
  principal?: boolean;
};

export type PortalPerfilResponse = {
  id?: string;
  customerCode?: string;
  documento?: {
    tipo?: string;
    numero?: string;
  };
  nombre?: string | null;
  apellido?: string | null;
  razonSocial?: string | null;
  fechaNacimiento?: string | null;
  contactos?: PortalPerfilContacto[];
  afiliaciones?: PortalPerfilAfiliacion[];
  domicilios?: PortalPerfilDomicilio[];
};

export type PortalPerfilSummary = {
  displayName: string;
  affiliateNumber: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
};

export type PortalPerfilDetails = PortalPerfilSummary & {
  birthDate: string;
  legalAddress: string;
  residenceAddress: string;
};