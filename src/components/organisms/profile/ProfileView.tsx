"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Mail, Phone, Search, UserRound, X } from "lucide-react";
import { ProfileViewSkeleton } from "@/components/organisms/loading/ViewSkeletons";
import { ProfileField } from "@/components/molecules/home/ProfileField";
import { Switch } from "@/components/ui/switch";
import { usePortalPerfilContext } from "@/lib/portal-perfil-context";
import {
  formatAddress,
  getPortalPerfilDetails,
  normalizeText,
  pickPreferredAfiliacion,
  pickPreferredContacto,
  pickPreferredDomicilio,
} from "@/lib/portal-profile";
import type {
  PortalPerfilAfiliacion,
  PortalPerfilContacto,
  PortalPerfilDomicilio,
  PortalPerfilResponse,
} from "@/types/portal-profile";
import styles from "./ProfileView.module.scss";

type ProfileData = {
  fullName: string;
  birthDate: string;
  identification: string;
  legalAddress: string;
  phone: string;
  residenceAddress: string;
  email: string;
  affiliateNumber: string | null;
  addressStreet: string;
  addressNumber: string;
  addressFloor: string;
  addressApartment: string;
  addressCity: string;
  addressProvince: string;
  addressPostalCode: string;
  addressCountry: string;
};

type ProfileViewProps = {
  perfil: PortalPerfilResponse | null;
  variant?: "cora" | "socios";
  isLoading?: boolean;
};

type AffiliationFormData = {
  searchTerm: string;
  obraSocialId: string;
  planId: string;
  affiliateNumber: string;
  startsAt: string;
  endsAt: string;
  notes: string;
  isCurrent: boolean;
  isHolder: boolean;
  isPrimary: boolean;
};

type LocalAffiliationPreview = {
  mode: "saved";
  providerName: string;
  affiliateNumber: string;
  planName?: string | null;
};

type ObraSocialPlan = {
  id: string;
  obraSocialId?: string;
  nombre: string;
  activo?: boolean;
};

type ObraSocialCatalogItem = {
  id: string;
  nombre: string;
  codigoSssalud?: string;
  activo?: boolean;
  planes?: ObraSocialPlan[];
};

type ObrasSocialesCatalogResponse = {
  items?: ObraSocialCatalogItem[];
};

type ProfileFeedback = {
  type: "success" | "error";
  message: string;
};

type ContactType = "EMAIL" | "TELEFONO";

type ContactFormData = {
  id: string | null;
  tipo: ContactType;
  valor: string;
  regionIso2: string;
  principal: boolean;
  verificado: boolean;
};

type DomicilioFormData = {
  street: string;
  number: string;
  floor: string;
  apartment: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

const initialAffiliationForm: AffiliationFormData = {
  searchTerm: "",
  obraSocialId: "",
  planId: "",
  affiliateNumber: "",
  startsAt: "",
  endsAt: "",
  notes: "",
  isCurrent: true,
  isHolder: true,
  isPrimary: false,
};

const buildDomicilioFormData = (
  domicilio: PortalPerfilDomicilio | null,
): DomicilioFormData => ({
  street: domicilio?.calle ?? "",
  number: domicilio?.numero ?? "",
  floor: domicilio?.piso ?? "",
  apartment: domicilio?.depto ?? "",
  city: domicilio?.ciudad ?? "",
  province: domicilio?.provincia ?? "",
  postalCode: domicilio?.codPostal ?? "",
  country: domicilio?.pais ?? "Argentina",
});

const buildContactFormData = (
  tipo: ContactType,
  contacto: PortalPerfilContacto | null,
): ContactFormData => ({
  id: contacto?.id ?? null,
  tipo,
  valor: contacto?.valor ?? (tipo === "TELEFONO" ? "+549" : ""),
  regionIso2: contacto?.regionIso2 ?? "AR",
  principal: contacto?.principal ?? false,
  verificado: contacto?.verificado ?? false,
});

const getContactTypeLabel = (tipo: ContactType) => {
  return tipo === "TELEFONO" ? "Teléfono" : "Email";
};

const normalizeOptionalString = (value: string) => {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const getContactOptionValue = (contacto: PortalPerfilContacto) => {
  return contacto.id ?? `${contacto.tipo}:${contacto.valor ?? ""}`;
};

const getDomicilioOptionValue = (domicilio: PortalPerfilDomicilio) => {
  return (
    domicilio.id ??
    [domicilio.calle, domicilio.numero, domicilio.ciudad, domicilio.provincia]
      .filter(Boolean)
      .join("|")
  );
};

const getDomicilioOptionLabel = (domicilio: PortalPerfilDomicilio) => {
  const formatted = formatAddress(domicilio);
  return domicilio.principal ? `${formatted} (Principal)` : formatted;
};

const getAffiliationOptionValue = (afiliacion: PortalPerfilAfiliacion) => {
  return (
    afiliacion.id ??
    [
      normalizeText(afiliacion.obraSocialId),
      normalizeText(afiliacion.planId),
      normalizeText(afiliacion.nroAfiliado),
    ]
      .filter(Boolean)
      .join("|")
  );
};

const getAffiliationOptionLabel = (afiliacion: PortalPerfilAfiliacion) => {
  const obraSocial = normalizeText(afiliacion.obraSocialNombre);
  const plan = normalizeText(afiliacion.planNombre);
  const affiliateNumber = normalizeText(afiliacion.nroAfiliado);
  const parts = [obraSocial, plan].filter(Boolean);
  const prefix = parts.length > 0 ? parts.join(" - ") : "Afiliación";

  if (affiliateNumber) {
    return `${prefix} (${affiliateNumber})`;
  }

  return prefix;
};

const setPortalAfiliacionAsPrincipal = async (
  afiliacion: PortalPerfilAfiliacion,
) => {
  const obraSocialId = normalizeText(afiliacion.obraSocialId);

  if (!obraSocialId) {
    throw new Error(
      "La afiliación seleccionada no tiene obra social y no se puede actualizar.",
    );
  }

  const response = await fetch("/api/portal/me/afiliaciones/principal", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      obraSocialId,
      planId: normalizeOptionalString(afiliacion.planId ?? ""),
      nroAfiliado: normalizeOptionalString(afiliacion.nroAfiliado ?? ""),
    }),
  });

  if (!response.ok) {
    throw new Error(await readMutationError(response));
  }
};

const unsetPortalAfiliacionPrincipal = async () => {
  const response = await fetch("/api/portal/me/afiliaciones/principal/unset", {
    method: "PATCH",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await readMutationError(response));
  }
};

const readMutationError = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
      message?: string;
    } | null;

    return data?.message || data?.error || "No se pudieron guardar los cambios";
  }

  return (
    (await response.text().catch(() => "")) ||
    "No se pudieron guardar los cambios"
  );
};

const formatEditableAddress = (
  profileData: Pick<
    ProfileData,
    | "addressStreet"
    | "addressNumber"
    | "addressFloor"
    | "addressApartment"
    | "addressCity"
    | "addressProvince"
  >,
) => {
  return formatAddress({
    calle: profileData.addressStreet,
    numero: profileData.addressNumber,
    piso: profileData.addressFloor,
    depto: profileData.addressApartment,
    ciudad: profileData.addressCity,
    provincia: profileData.addressProvince,
  });
};

const syncProfileAddressFields = (profileData: ProfileData): ProfileData => {
  const formattedAddress = formatEditableAddress(profileData);

  return {
    ...profileData,
    legalAddress: formattedAddress,
    residenceAddress: formattedAddress,
  };
};

const buildProfileData = (perfil: PortalPerfilResponse | null): ProfileData => {
  const details = getPortalPerfilDetails(perfil);
  const domicilio = pickPreferredDomicilio(perfil?.domicilios);

  return syncProfileAddressFields({
    fullName: details.displayName,
    birthDate: details.birthDate,
    identification: details.documentNumber ?? "Sin dato",
    legalAddress: details.legalAddress,
    phone: details.phone ?? "Sin dato",
    residenceAddress: details.residenceAddress,
    email: details.email ?? "Sin dato",
    affiliateNumber: details.affiliateNumber,
    addressStreet: domicilio?.calle ?? "",
    addressNumber: domicilio?.numero ?? "",
    addressFloor: domicilio?.piso ?? "",
    addressApartment: domicilio?.depto ?? "",
    addressCity: domicilio?.ciudad ?? "",
    addressProvince: domicilio?.provincia ?? "",
    addressPostalCode: domicilio?.codPostal ?? "",
    addressCountry: domicilio?.pais ?? "Argentina",
  });
};

const savePortalContact = async (
  contacto: PortalPerfilContacto | null,
  formData: ContactFormData,
) => {
  const normalizedValue = formData.valor.trim();

  if (!normalizedValue) {
    if (normalizeText(contacto?.valor)) {
      throw new Error(
        "Para eliminar un contacto existente todavía falta conectar la baja desde el portal.",
      );
    }

    return;
  }

  const payload = {
    tipo: formData.tipo,
    valor: normalizedValue,
    ...(contacto?.regionIso2 || formData.tipo === "TELEFONO"
      ? { regionIso2: formData.regionIso2 || "AR" }
      : {}),
    principal: formData.principal,
    verificado: formData.verificado,
  };

  const response = await fetch(
    contacto?.id
      ? `/api/portal/me/contactos/${contacto.id}`
      : "/api/portal/me/contactos",
    {
      method: contacto?.id ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readMutationError(response));
  }
};

const setPortalContactAsPrincipal = async (contacto: PortalPerfilContacto) => {
  if (!contacto.id) {
    throw new Error("El contacto seleccionado no tiene id y no se puede actualizar.");
  }

  await savePortalContact(contacto, {
    id: contacto.id,
    tipo: contacto.tipo === "EMAIL" ? "EMAIL" : "TELEFONO",
    valor: contacto.valor ?? "",
    regionIso2: contacto.regionIso2 ?? "AR",
    principal: true,
    verificado: contacto.verificado ?? false,
  });
};

const savePortalDomicilio = async (
  domicilio: PortalPerfilDomicilio | null,
  profileData: ProfileData,
) => {
  const payload = {
    etiqueta: domicilio?.etiqueta ?? "Principal",
    calle: profileData.addressStreet.trim(),
    numero: profileData.addressNumber.trim() || undefined,
    piso: profileData.addressFloor.trim() || undefined,
    depto: profileData.addressApartment.trim() || undefined,
    referencia: domicilio?.referencia ?? undefined,
    ciudad: profileData.addressCity.trim(),
    provincia: profileData.addressProvince.trim(),
    codPostal: profileData.addressPostalCode.trim() || undefined,
    pais: profileData.addressCountry.trim() || domicilio?.pais || "Argentina",
    lat: domicilio?.lat ?? undefined,
    long: domicilio?.long ?? undefined,
    principal: domicilio?.principal ?? true,
  };

  if (!payload.calle || !payload.ciudad || !payload.provincia) {
    throw new Error(
      "Para guardar el domicilio completá calle, ciudad y provincia.",
    );
  }

  const response = await fetch(
    domicilio?.id
      ? `/api/portal/me/domicilios/${domicilio.id}`
      : "/api/portal/me/domicilios",
    {
      method: domicilio?.id ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readMutationError(response));
  }
};

const setPortalDomicilioAsPrincipal = async (
  domicilio: PortalPerfilDomicilio,
) => {
  if (!domicilio.id) {
    throw new Error("El domicilio seleccionado no tiene id y no se puede actualizar.");
  }

  const nextProfile = syncProfileAddressFields({
    fullName: "",
    birthDate: "",
    identification: "",
    legalAddress: "",
    phone: "",
    residenceAddress: "",
    email: "",
    affiliateNumber: null,
    addressStreet: domicilio.calle ?? "",
    addressNumber: domicilio.numero ?? "",
    addressFloor: domicilio.piso ?? "",
    addressApartment: domicilio.depto ?? "",
    addressCity: domicilio.ciudad ?? "",
    addressProvince: domicilio.provincia ?? "",
    addressPostalCode: domicilio.codPostal ?? "",
    addressCountry: domicilio.pais ?? "Argentina",
  });

  await savePortalDomicilio(
    {
      ...domicilio,
      principal: true,
    },
    nextProfile,
  );
};

export function ProfileView({
  perfil,
  variant = "socios",
  isLoading = false,
}: ProfileViewProps) {
  const { refresh } = usePortalPerfilContext();
  const [isAffiliationModalOpen, setIsAffiliationModalOpen] = useState(false);
  const [isContactoModalOpen, setIsContactoModalOpen] = useState(false);
  const [isDomicilioModalOpen, setIsDomicilioModalOpen] = useState(false);
  const [affiliationForm, setAffiliationForm] = useState<AffiliationFormData>(
    initialAffiliationForm,
  );
  const [obraSocialSearchResults, setObraSocialSearchResults] = useState<
    ObraSocialCatalogItem[]
  >([]);
  const [isSearchingObrasSociales, setIsSearchingObrasSociales] =
    useState(false);
  const [isSavingAffiliation, setIsSavingAffiliation] = useState(false);
  const [contactForm, setContactForm] = useState<ContactFormData>(
    buildContactFormData("TELEFONO", null),
  );
  const [domicilioForm, setDomicilioForm] = useState<DomicilioFormData>(
    buildDomicilioFormData(null),
  );
  const [localAffiliationPreview, setLocalAffiliationPreview] =
    useState<LocalAffiliationPreview | null>(null);
  const [editableProfile, setEditableProfile] = useState<ProfileData | null>(
    null,
  );
  const [isSwitchingPhone, setIsSwitchingPhone] = useState(false);
  const [isSwitchingEmail, setIsSwitchingEmail] = useState(false);
  const [isSavingContacto, setIsSavingContacto] = useState(false);
  const [isSwitchingDomicilio, setIsSwitchingDomicilio] = useState(false);
  const [isSavingDomicilio, setIsSavingDomicilio] = useState(false);
  const [profileFeedback, setProfileFeedback] =
    useState<ProfileFeedback | null>(null);

  const allContactos = useMemo(
    () => (Array.isArray(perfil?.contactos) ? perfil.contactos : []),
    [perfil],
  );
  const telefonos = useMemo(
    () => allContactos.filter((contacto) => contacto.tipo === "TELEFONO"),
    [allContactos],
  );
  const emails = useMemo(
    () => allContactos.filter((contacto) => contacto.tipo === "EMAIL"),
    [allContactos],
  );
  const domicilios = useMemo(
    () => (Array.isArray(perfil?.domicilios) ? perfil.domicilios : []),
    [perfil],
  );
  const afiliaciones = useMemo(
    () => (Array.isArray(perfil?.afiliaciones) ? perfil.afiliaciones : []),
    [perfil],
  );
  const preferredEmail = useMemo(
    () => pickPreferredContacto(perfil?.contactos, "EMAIL"),
    [perfil],
  );
  const preferredPhone = useMemo(
    () => pickPreferredContacto(perfil?.contactos, "TELEFONO"),
    [perfil],
  );
  const preferredDomicilio = useMemo(
    () => pickPreferredDomicilio(perfil?.domicilios),
    [perfil],
  );
  const preferredAfiliacion = useMemo(
    () => pickPreferredAfiliacion(perfil?.afiliaciones),
    [perfil],
  );
  const profile = useMemo<ProfileData>(
    () => buildProfileData(perfil),
    [perfil],
  );

  useEffect(() => {
    setEditableProfile(profile);
  }, [profile]);

  useEffect(() => {
    setDomicilioForm(buildDomicilioFormData(preferredDomicilio));
  }, [preferredDomicilio]);

  const currentProfile = editableProfile ?? profile;
  const displayedAffiliateNumber = currentProfile.affiliateNumber;
  const hasAffiliateNumber = Boolean(displayedAffiliateNumber?.trim());
  const hasPendingAffiliationPreview = Boolean(localAffiliationPreview);
  const hasSavedDomicilio = Boolean(preferredDomicilio);
  const isSociosVariant = variant === "socios";
  const isCoraVariant = variant === "cora";
  const isAffiliationFormValid =
    affiliationForm.obraSocialId.trim().length > 0 &&
    affiliationForm.affiliateNumber.trim().length > 0;
  const selectedObraSocial = useMemo(
    () =>
      obraSocialSearchResults.find(
        (obraSocial) => obraSocial.id === affiliationForm.obraSocialId,
      ) ?? null,
    [affiliationForm.obraSocialId, obraSocialSearchResults],
  );
  const availablePlanes = useMemo(
    () => (selectedObraSocial?.planes ?? []).filter((plan) => plan.activo !== false),
    [selectedObraSocial],
  );
  const requiresPlanSelection = availablePlanes.length > 0;
  const isAffiliationSubmitDisabled =
    !isAffiliationFormValid ||
    isSavingAffiliation ||
    (requiresPlanSelection && affiliationForm.planId.trim().length === 0);
  const selectedAffiliationValue = preferredAfiliacion
    ? getAffiliationOptionValue(preferredAfiliacion)
    : "";

  const initials = useMemo(() => {
    return currentProfile.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0]?.toUpperCase() ?? "")
      .join("");
  }, [currentProfile.fullName]);

  if (isLoading) {
    return <ProfileViewSkeleton variant={variant} />;
  }

  const handleOpenAffiliationModal = () => {
    setIsAffiliationModalOpen(true);
  };

  const handleCloseAffiliationModal = () => {
    if (isSavingAffiliation) {
      return;
    }

    setIsAffiliationModalOpen(false);
    setAffiliationForm(initialAffiliationForm);
    setObraSocialSearchResults([]);
  };

  const handleOpenContactoModal = (
    tipo: ContactType,
    contacto: PortalPerfilContacto | null = null,
  ) => {
    setContactForm(buildContactFormData(tipo, contacto));
    setProfileFeedback(null);
    setIsContactoModalOpen(true);
  };

  const handleCloseContactoModal = () => {
    if (isSavingContacto) {
      return;
    }

    setIsContactoModalOpen(false);
  };

  const handleOpenDomicilioModal = () => {
    setDomicilioForm(buildDomicilioFormData(null));
    setProfileFeedback(null);
    setIsDomicilioModalOpen(true);
  };

  const handleCloseDomicilioModal = () => {
    if (isSavingDomicilio) {
      return;
    }

    setIsDomicilioModalOpen(false);
    setDomicilioForm(buildDomicilioFormData(preferredDomicilio));
  };

  const handleAffiliationInputChange = <T extends keyof AffiliationFormData>(
    field: T,
    value: AffiliationFormData[T],
  ) => {
    setAffiliationForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSearchObrasSociales = async () => {
    const term = affiliationForm.searchTerm.trim();
    if (!term) {
      setObraSocialSearchResults([]);
      return;
    }

    try {
      setIsSearchingObrasSociales(true);
      setProfileFeedback(null);

      const response = await fetch(
        `/api/portal/me/obras-sociales?term=${encodeURIComponent(term)}&limit=20`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(await readMutationError(response));
      }

      const data = (await response.json()) as ObrasSocialesCatalogResponse;
      const items = Array.isArray(data.items)
        ? data.items.filter((obraSocial) => obraSocial?.activo !== false)
        : [];

      setObraSocialSearchResults(items);
      setAffiliationForm((current) => {
        const hasSelectedItem = items.some(
          (obraSocial) => obraSocial.id === current.obraSocialId,
        );

        if (hasSelectedItem) {
          return current;
        }

        return {
          ...current,
          obraSocialId: "",
          planId: "",
        };
      });

      if (items.length === 0) {
        setProfileFeedback({
          type: "error",
          message: "No encontramos obras sociales para esa búsqueda.",
        });
      }
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No pudimos buscar obras sociales.",
      });
    } finally {
      setIsSearchingObrasSociales(false);
    }
  };

  const handleAffiliationSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isAffiliationSubmitDisabled || !selectedObraSocial) {
      return;
    }

    try {
      setIsSavingAffiliation(true);
      setProfileFeedback(null);

      const response = await fetch("/api/portal/me/afiliaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          obraSocialId: affiliationForm.obraSocialId,
          planId: normalizeOptionalString(affiliationForm.planId),
          nroAfiliado: normalizeOptionalString(affiliationForm.affiliateNumber),
          desde: normalizeOptionalString(affiliationForm.startsAt),
          hasta: normalizeOptionalString(affiliationForm.endsAt),
          notas: normalizeOptionalString(affiliationForm.notes),
          vigente: affiliationForm.isCurrent,
          titular: affiliationForm.isHolder,
          principal: affiliationForm.isPrimary,
        }),
      });

      if (!response.ok) {
        throw new Error(await readMutationError(response));
      }

      const selectedPlan = availablePlanes.find(
        (plan) => plan.id === affiliationForm.planId,
      );

      setLocalAffiliationPreview({
        mode: "saved",
        providerName: selectedObraSocial.nombre,
        affiliateNumber: affiliationForm.affiliateNumber.trim(),
        planName: selectedPlan?.nombre ?? null,
      });
      setProfileFeedback({
        type: "success",
        message: "La afiliación se guardó correctamente.",
      });
      await refresh();
      handleCloseAffiliationModal();
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la afiliación.",
      });
    } finally {
      setIsSavingAffiliation(false);
    }
  };

  const handleSelectPrincipalAffiliacion = async (nextValue: string) => {
    try {
      setIsSavingAffiliation(true);
      setProfileFeedback(null);

      if (!nextValue) {
        await unsetPortalAfiliacionPrincipal();
        setLocalAffiliationPreview(null);
        setProfileFeedback({
          type: "success",
          message: "Se quitó la afiliación principal del perfil.",
        });
        await refresh();
        return;
      }

      const selected = afiliaciones.find(
        (afiliacion) => getAffiliationOptionValue(afiliacion) === nextValue,
      );

      if (!selected) {
        return;
      }

      await setPortalAfiliacionAsPrincipal(selected);
      setLocalAffiliationPreview(null);
      setProfileFeedback({
        type: "success",
        message: "Afiliación principal actualizada.",
      });
      await refresh();
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar la afiliación principal.",
      });
    } finally {
      setIsSavingAffiliation(false);
    }
  };

  const handleDomicilioFieldChange = <T extends keyof DomicilioFormData>(
    field: T,
    value: DomicilioFormData[T],
  ) => {
    setDomicilioForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleContactFieldChange = <T extends keyof ContactFormData>(
    field: T,
    value: ContactFormData[T],
  ) => {
    setContactForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSelectPrincipalPhone = async (nextValue: string) => {
    const selected = telefonos.find(
      (contacto) => getContactOptionValue(contacto) === nextValue,
    );
    if (!selected) {
      return;
    }

    try {
      setIsSwitchingPhone(true);
      setProfileFeedback(null);
      await setPortalContactAsPrincipal(selected);
      setProfileFeedback({
        type: "success",
        message: "Teléfono principal actualizado.",
      });
      await refresh();
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el teléfono principal.",
      });
    } finally {
      setIsSwitchingPhone(false);
    }
  };

  const handleSelectPrincipalEmail = async (nextValue: string) => {
    const selected = emails.find(
      (contacto) => getContactOptionValue(contacto) === nextValue,
    );
    if (!selected) {
      return;
    }

    try {
      setIsSwitchingEmail(true);
      setProfileFeedback(null);
      await setPortalContactAsPrincipal(selected);
      setProfileFeedback({
        type: "success",
        message: "Email principal actualizado.",
      });
      await refresh();
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el email principal.",
      });
    } finally {
      setIsSwitchingEmail(false);
    }
  };

  const handleSelectPrincipalDomicilio = async (nextValue: string) => {
    const selected = domicilios.find(
      (domicilio) => getDomicilioOptionValue(domicilio) === nextValue,
    );
    if (!selected) {
      return;
    }

    try {
      setIsSwitchingDomicilio(true);
      setProfileFeedback(null);
      await setPortalDomicilioAsPrincipal(selected);
      setProfileFeedback({
        type: "success",
        message: "Domicilio principal actualizado.",
      });
      await refresh();
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el domicilio principal.",
      });
    } finally {
      setIsSwitchingDomicilio(false);
    }
  };

  const handleSaveContacto = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSavingContacto) {
      return;
    }

    if (!contactForm.valor.trim()) {
      setProfileFeedback({
        type: "error",
        message:
          contactForm.tipo === "TELEFONO"
            ? "Ingresá un número de teléfono para guardarlo."
            : "Ingresá un email para guardarlo.",
      });
      return;
    }

    try {
      setIsSavingContacto(true);
      setProfileFeedback(null);
      await savePortalContact(null, contactForm);
      setIsContactoModalOpen(false);
      setProfileFeedback({
        type: "success",
        message: `${getContactTypeLabel(contactForm.tipo)} guardado correctamente.`,
      });
      await refresh();
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el contacto.",
      });
    } finally {
      setIsSavingContacto(false);
    }
  };

  const handleSaveDomicilio = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSavingDomicilio || !editableProfile) {
      return;
    }

    const nextProfile = syncProfileAddressFields({
      ...editableProfile,
      addressStreet: domicilioForm.street,
      addressNumber: domicilioForm.number,
      addressFloor: domicilioForm.floor,
      addressApartment: domicilioForm.apartment,
      addressCity: domicilioForm.city,
      addressProvince: domicilioForm.province,
      addressPostalCode: domicilioForm.postalCode,
      addressCountry: domicilioForm.country.trim() || "Argentina",
    });

    try {
      setIsSavingDomicilio(true);
      setProfileFeedback(null);
      await savePortalDomicilio(null, nextProfile);
      setEditableProfile(nextProfile);
      setIsDomicilioModalOpen(false);
      setProfileFeedback({
        type: "success",
        message: "Tu domicilio se guardó correctamente.",
      });
      await refresh();
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el domicilio.",
      });
    } finally {
      setIsSavingDomicilio(false);
    }
  };

  const profileValues = currentProfile;

  return (
    <section
      className={`${styles.profileView} ${
        isSociosVariant ? styles.profileViewSocios : styles.profileViewCora
      }`}
    >
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Mis datos</h1>
          <p className={styles.subtitle}>Informacion personal y de contacto</p>
          <p className={styles.localEditHint}>
            Podés elegir qué contacto y qué domicilio querés usar, o cargar uno
            nuevo cuando lo necesites.
          </p>
        </div>
      </header>

      <article className={styles.card}>
        <div className={styles.profileTop}>
          <div className={styles.identityColumn}>
            <div className={styles.avatar}>{initials}</div>
          </div>

          <div className={styles.identityInfo}>
            <h2 className={styles.fullName}>{profileValues.fullName}</h2>

            {profileFeedback ? (
              <p
                className={
                  profileFeedback.type === "success"
                    ? styles.profileFeedbackSuccess
                    : styles.profileFeedbackError
                }
              >
                {profileFeedback.message}
              </p>
            ) : null}

            <div className={styles.sectionsGrid}>
              <section>
                <h3 className={styles.sectionTitle}>Mis datos personales</h3>
                <div className={styles.fieldsGrid}>
                  <ProfileField
                    label="Nombre"
                    value={profileValues.fullName}
                    readOnly
                  />
                  <ProfileField
                    label="Fecha de nacimiento"
                    value={profileValues.birthDate}
                    readOnly
                  />
                  <ProfileField
                    label="Identificacion"
                    value={profileValues.identification}
                    readOnly
                  />
                  <ProfileField
                    label="Domicilio Legal"
                    value={profileValues.legalAddress}
                    readOnly
                  />
                </div>
              </section>

              <section>
                <h3 className={styles.sectionTitle}>Mis datos de contacto</h3>
                <div className={styles.fieldsGrid}>
                  <div className={styles.selectorGroup}>
                    <label
                      className={styles.selectorLabel}
                      htmlFor="phone-select"
                    >
                      Elegir teléfono principal
                    </label>
                    <div className={styles.selectorRow}>
                      <select
                        id="phone-select"
                        className={styles.selectorInput}
                        value={
                          preferredPhone
                            ? getContactOptionValue(preferredPhone)
                            : ""
                        }
                        onChange={(event) =>
                          void handleSelectPrincipalPhone(event.target.value)
                        }
                        disabled={telefonos.length === 0 || isSwitchingPhone}
                      >
                        {telefonos.length === 0 ? (
                          <option value="">No hay teléfonos cargados</option>
                        ) : null}
                        {telefonos.map((contacto) => (
                          <option
                            key={getContactOptionValue(contacto)}
                            value={getContactOptionValue(contacto)}
                          >
                            {contacto.valor ?? "Sin dato"}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.selectorActionButton}
                        onClick={() => handleOpenContactoModal("TELEFONO")}
                      >
                        Añadir nuevo
                      </button>
                    </div>
                    <p className={styles.contactInlineHint}>
                      {telefonos.length > 0
                        ? ""
                        : "Todavía no hay teléfonos guardados."}
                    </p>
                  </div>
                  <div className={styles.addressFieldGroup}>
                    <div className={styles.addressInlineAction}>
                      <label
                        className={styles.selectorLabel}
                        htmlFor="domicilio-select"
                      >
                        Elegir domicilio principal
                      </label>
                      <div className={styles.selectorRow}>
                        <select
                          id="domicilio-select"
                          className={styles.selectorInput}
                          value={
                            preferredDomicilio
                              ? getDomicilioOptionValue(preferredDomicilio)
                              : ""
                          }
                          onChange={(event) =>
                            void handleSelectPrincipalDomicilio(
                              event.target.value,
                            )
                          }
                          disabled={
                            domicilios.length === 0 || isSwitchingDomicilio
                          }
                        >
                          {domicilios.length === 0 ? (
                            <option value="">No hay domicilios cargados</option>
                          ) : null}
                          {domicilios.map((domicilio) => (
                            <option
                              key={getDomicilioOptionValue(domicilio)}
                              value={getDomicilioOptionValue(domicilio)}
                            >
                              {getDomicilioOptionLabel(domicilio)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className={styles.selectorActionButton}
                          onClick={handleOpenDomicilioModal}
                        >
                          Añadir nuevo domicilio
                        </button>
                      </div>
                      <p className={styles.addressInlineHint}>
                        {hasSavedDomicilio
                          ? ""
                          : "Todavía no tenés un domicilio cargado."}
                      </p>
                    </div>
                  </div>
                  <div className={styles.selectorGroup}>
                    <label
                      className={styles.selectorLabel}
                      htmlFor="email-select"
                    >
                      Elegir email principal
                    </label>
                    <div className={styles.selectorRow}>
                      <select
                        id="email-select"
                        className={styles.selectorInput}
                        value={
                          preferredEmail
                            ? getContactOptionValue(preferredEmail)
                            : ""
                        }
                        onChange={(event) =>
                          void handleSelectPrincipalEmail(event.target.value)
                        }
                        disabled={emails.length === 0 || isSwitchingEmail}
                      >
                        {emails.length === 0 ? (
                          <option value="">No hay emails cargados</option>
                        ) : null}
                        {emails.map((contacto) => (
                          <option
                            key={getContactOptionValue(contacto)}
                            value={getContactOptionValue(contacto)}
                          >
                            {contacto.valor ?? "Sin dato"}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.selectorActionButton}
                        onClick={() => handleOpenContactoModal("EMAIL")}
                      >
                        Añadir nuevo
                      </button>
                    </div>
                    <p className={styles.contactInlineHint}>
                      {emails.length > 0
                        ? ""
                        : "Todavía no hay emails guardados."}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div
          className={`${styles.affiliationCard} ${
            isSociosVariant
              ? styles.affiliationCardSocios
              : styles.affiliationCardCora
          }`}
        >
          <div className={styles.affiliationContent}>
            {isSociosVariant ? (
              <>
                <p className={styles.affiliationLabel}>
                  {hasAffiliateNumber
                    ? "Numero de afiliacion"
                    : "Estado de afiliacion"}
                </p>
                <p className={styles.affiliationValue}>
                  {hasAffiliateNumber
                    ? displayedAffiliateNumber
                    : "Sin numero de afiliado"}
                </p>
                {hasPendingAffiliationPreview ? (
                  <p className={styles.affiliationHint}>
                    Obra social cargada: {localAffiliationPreview?.providerName}
                    {localAffiliationPreview?.planName
                      ? ` - ${localAffiliationPreview.planName}`
                      : ""}
                    .
                  </p>
                ) : null}
                {!hasAffiliateNumber ? (
                  <p className={styles.affiliationHint}>
                    Todavia no registramos una obra social asociada para este
                    perfil.
                  </p>
                ) : null}
                <div className={styles.affiliationSelectorGroup}>
                  <label
                    className={styles.affiliationSelectorLabel}
                    htmlFor="affiliation-select"
                  >
                    Elegir afiliación principal
                  </label>
                  <div className={styles.selectorRow}>
                    <select
                      id="affiliation-select"
                      className={styles.selectorInput}
                      value={selectedAffiliationValue}
                      onChange={(event) =>
                        void handleSelectPrincipalAffiliacion(event.target.value)
                      }
                      disabled={isSavingAffiliation}
                    >
                      <option value="">Sin afiliación principal</option>
                      {afiliaciones.map((afiliacion) => (
                        <option
                          key={getAffiliationOptionValue(afiliacion)}
                          value={getAffiliationOptionValue(afiliacion)}
                        >
                          {getAffiliationOptionLabel(afiliacion)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.affiliationAction}
                      onClick={handleOpenAffiliationModal}
                    >
                      {hasAffiliateNumber
                        ? "Agregar nueva afiliación"
                        : "Agregar obra social"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className={styles.affiliationLabelCora}>
                  Numero de Afiliacion
                </p>
                <p className={styles.affiliationValueCora}>
                  {hasAffiliateNumber
                    ? displayedAffiliateNumber
                    : "Sin numero de afiliado"}
                </p>
                {hasPendingAffiliationPreview ? (
                  <p className={styles.affiliationHintCora}>
                    Obra social cargada: {localAffiliationPreview?.providerName}
                    {localAffiliationPreview?.planName
                      ? ` - ${localAffiliationPreview.planName}`
                      : ""}
                    .
                  </p>
                ) : null}
                <div className={styles.affiliationSelectorGroup}>
                  <label
                    className={styles.affiliationSelectorLabelCora}
                    htmlFor="affiliation-select-cora"
                  >
                    Elegir afiliación principal
                  </label>
                  <div className={styles.selectorRow}>
                    <select
                      id="affiliation-select-cora"
                      className={styles.selectorInput}
                      value={selectedAffiliationValue}
                      onChange={(event) =>
                        void handleSelectPrincipalAffiliacion(event.target.value)
                      }
                      disabled={isSavingAffiliation}
                    >
                      <option value="">Sin afiliación principal</option>
                      {afiliaciones.map((afiliacion) => (
                        <option
                          key={getAffiliationOptionValue(afiliacion)}
                          value={getAffiliationOptionValue(afiliacion)}
                        >
                          {getAffiliationOptionLabel(afiliacion)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.affiliationActionCora}
                      onClick={handleOpenAffiliationModal}
                    >
                      {hasAffiliateNumber
                        ? "Agregar nueva afiliación"
                        : "Agregar obra social"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <UserRound
            size={28}
            className={
              isSociosVariant
                ? styles.affiliationIcon
                : styles.affiliationIconCora
            }
          />
        </div>
      </article>

      {isContactoModalOpen ? (
        <div className={styles.modalOverlay} onClick={handleCloseContactoModal}>
          <div
            className={styles.modalDialog}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contacto-modal-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <h2 id="contacto-modal-title" className={styles.modalTitle}>
                  Agregar un nuevo contacto
                </h2>
                <p className={styles.modalSubtitle}>
                  Completá los datos de contacto del cliente.
                </p>
              </div>

              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={handleCloseContactoModal}
                aria-label="Cerrar formulario de contacto"
              >
                <X size={22} />
              </button>
            </header>

            <form className={styles.modalForm} onSubmit={handleSaveContacto}>
              <div className={styles.fieldBlock}>
                <p className={styles.fieldLabel}>Tipo de contacto</p>
                <div className={styles.contactTypeGrid}>
                  <button
                    type="button"
                    className={`${styles.contactTypeCard} ${contactForm.tipo === "TELEFONO" ? styles.contactTypeCardActive : ""}`}
                    onClick={() => handleOpenContactoModal("TELEFONO")}
                  >
                    <Phone size={24} />
                    <span>Teléfono</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.contactTypeCard} ${contactForm.tipo === "EMAIL" ? styles.contactTypeCardActive : ""}`}
                    onClick={() => handleOpenContactoModal("EMAIL")}
                  >
                    <Mail size={24} />
                    <span>Email</span>
                  </button>
                </div>
              </div>

              <div className={styles.fieldBlock}>
                <label className={styles.fieldLabel} htmlFor="contact-value">
                  {contactForm.tipo === "TELEFONO"
                    ? "Número de teléfono"
                    : "Email"}
                </label>
                <input
                  id="contact-value"
                  type={contactForm.tipo === "TELEFONO" ? "tel" : "email"}
                  value={contactForm.valor}
                  onChange={(event) =>
                    handleContactFieldChange("valor", event.target.value)
                  }
                  className={styles.fieldInput}
                  placeholder={
                    contactForm.tipo === "TELEFONO"
                      ? "+549"
                      : "usuario@email.com"
                  }
                />
              </div>

              {contactForm.tipo === "TELEFONO" ? (
                <div className={styles.fieldBlock}>
                  <label className={styles.fieldLabel} htmlFor="contact-region">
                    Región ISO2
                  </label>
                  <input
                    id="contact-region"
                    type="text"
                    value={contactForm.regionIso2}
                    onChange={(event) =>
                      handleContactFieldChange(
                        "regionIso2",
                        event.target.value.toUpperCase(),
                      )
                    }
                    className={styles.fieldInput}
                    maxLength={2}
                    placeholder="AR"
                  />
                </div>
              ) : null}

              <div className={styles.contactSwitchList}>
                <div className={styles.contactSwitchRow}>
                  <span className={styles.contactSwitchLabel}>Verificado</span>
                  <div className={styles.switchWrap}>
                    <Switch
                      checked={contactForm.verificado}
                      onCheckedChange={(checked) =>
                        handleContactFieldChange("verificado", checked)
                      }
                    />
                  </div>
                </div>
                <div className={styles.contactSwitchRow}>
                  <span className={styles.contactSwitchLabel}>
                    Contacto principal
                  </span>
                  <div className={styles.switchWrap}>
                    <Switch
                      checked={contactForm.principal}
                      onCheckedChange={(checked) =>
                        handleContactFieldChange("principal", checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={handleCloseContactoModal}
                  disabled={isSavingContacto}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryAction}
                  disabled={isSavingContacto}
                >
                  {isSavingContacto ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isDomicilioModalOpen ? (
        <div
          className={styles.modalOverlay}
          onClick={handleCloseDomicilioModal}
        >
          <div
            className={styles.modalDialog}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="domicilio-modal-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <h2 id="domicilio-modal-title" className={styles.modalTitle}>
                  Añadir nuevo domicilio
                </h2>
                <p className={styles.modalSubtitle}>
                  Cargá un domicilio nuevo para guardarlo como principal en el
                  portal.
                </p>
              </div>

              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={handleCloseDomicilioModal}
                aria-label="Cerrar formulario de domicilio"
              >
                <X size={22} />
              </button>
            </header>

            <form className={styles.modalForm} onSubmit={handleSaveDomicilio}>
              <div className={styles.addressGrid}>
                <div className={styles.fieldBlock}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor="profile-address-street"
                  >
                    Calle *
                  </label>
                  <input
                    id="profile-address-street"
                    type="text"
                    className={styles.fieldInput}
                    value={domicilioForm.street}
                    onChange={(event) =>
                      handleDomicilioFieldChange("street", event.target.value)
                    }
                  />
                </div>

                <div className={styles.fieldBlock}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor="profile-address-number"
                  >
                    Numero
                  </label>
                  <input
                    id="profile-address-number"
                    type="text"
                    className={styles.fieldInput}
                    value={domicilioForm.number}
                    onChange={(event) =>
                      handleDomicilioFieldChange("number", event.target.value)
                    }
                  />
                </div>

                <div className={styles.fieldBlock}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor="profile-address-floor"
                  >
                    Piso
                  </label>
                  <input
                    id="profile-address-floor"
                    type="text"
                    className={styles.fieldInput}
                    value={domicilioForm.floor}
                    onChange={(event) =>
                      handleDomicilioFieldChange("floor", event.target.value)
                    }
                  />
                </div>

                <div className={styles.fieldBlock}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor="profile-address-apartment"
                  >
                    Depto
                  </label>
                  <input
                    id="profile-address-apartment"
                    type="text"
                    className={styles.fieldInput}
                    value={domicilioForm.apartment}
                    onChange={(event) =>
                      handleDomicilioFieldChange(
                        "apartment",
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className={styles.fieldBlock}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor="profile-address-city"
                  >
                    Ciudad *
                  </label>
                  <input
                    id="profile-address-city"
                    type="text"
                    className={styles.fieldInput}
                    value={domicilioForm.city}
                    onChange={(event) =>
                      handleDomicilioFieldChange("city", event.target.value)
                    }
                  />
                </div>

                <div className={styles.fieldBlock}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor="profile-address-province"
                  >
                    Provincia *
                  </label>
                  <input
                    id="profile-address-province"
                    type="text"
                    className={styles.fieldInput}
                    value={domicilioForm.province}
                    onChange={(event) =>
                      handleDomicilioFieldChange("province", event.target.value)
                    }
                  />
                </div>

                <div className={styles.fieldBlock}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor="profile-address-postal-code"
                  >
                    Codigo postal
                  </label>
                  <input
                    id="profile-address-postal-code"
                    type="text"
                    className={styles.fieldInput}
                    value={domicilioForm.postalCode}
                    onChange={(event) =>
                      handleDomicilioFieldChange(
                        "postalCode",
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className={styles.fieldBlock}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor="profile-address-country"
                  >
                    Pais
                  </label>
                  <input
                    id="profile-address-country"
                    type="text"
                    className={styles.fieldInput}
                    value={domicilioForm.country}
                    onChange={(event) =>
                      handleDomicilioFieldChange("country", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={handleCloseDomicilioModal}
                  disabled={isSavingDomicilio}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryAction}
                  disabled={isSavingDomicilio}
                >
                  {isSavingDomicilio ? "Guardando..." : "Guardar domicilio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isAffiliationModalOpen ? (
        <div
          className={styles.modalOverlay}
          onClick={handleCloseAffiliationModal}
        >
          <div
            className={`${styles.modalDialog} ${
              isCoraVariant ? styles.modalDialogCora : styles.modalDialogSocios
            }`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="affiliation-modal-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <h2 id="affiliation-modal-title" className={styles.modalTitle}>
                  Agregar Nueva Afiliacion
                </h2>
                <p className={styles.modalSubtitle}>
                  Completa los datos de la obra social para este cliente.
                </p>
              </div>

              <button
                type="button"
                className={`${styles.modalCloseButton} ${
                  isCoraVariant
                    ? styles.modalCloseButtonCora
                    : styles.modalCloseButtonSocios
                }`}
                onClick={handleCloseAffiliationModal}
                aria-label="Cerrar formulario de afiliacion"
              >
                <X size={22} />
              </button>
            </header>

            <form
              className={styles.modalForm}
              onSubmit={handleAffiliationSubmit}
            >
              <div className={styles.fieldBlock}>
                <label className={styles.fieldLabel} htmlFor="providerName">
                  Buscar Obra Social *
                </label>
                <div className={styles.searchRow}>
                  <input
                    id="providerName"
                    type="text"
                    value={affiliationForm.searchTerm}
                    onChange={(event) =>
                      handleAffiliationInputChange(
                        "searchTerm",
                        event.target.value,
                      )
                    }
                    className={styles.fieldInput}
                    placeholder="Ej: OSDE, Swiss Medical, PAMI..."
                  />
                  <button
                    type="button"
                    className={styles.searchButton}
                    onClick={() => {
                      void handleSearchObrasSociales();
                    }}
                    disabled={
                      isSearchingObrasSociales ||
                      affiliationForm.searchTerm.trim().length === 0
                    }
                  >
                    <Search size={16} />
                    {isSearchingObrasSociales ? "Buscando..." : "Buscar"}
                  </button>
                </div>
              </div>

              {obraSocialSearchResults.length > 0 ? (
                <div className={styles.fieldBlock}>
                  <label className={styles.fieldLabel} htmlFor="obraSocialId">
                    Seleccionar Obra Social *
                  </label>
                  <select
                    id="obraSocialId"
                    className={styles.selectorInput}
                    value={affiliationForm.obraSocialId}
                    onChange={(event) => {
                      const obraSocialId = event.target.value;
                      const obraSocial = obraSocialSearchResults.find(
                        (item) => item.id === obraSocialId,
                      );
                      const activePlanes = (obraSocial?.planes ?? []).filter(
                        (plan) => plan.activo !== false,
                      );

                      setAffiliationForm((current) => ({
                        ...current,
                        obraSocialId,
                        planId:
                          activePlanes.some((plan) => plan.id === current.planId)
                            ? current.planId
                            : "",
                      }));
                    }}
                  >
                    <option value="">Seleccione una obra social</option>
                    {obraSocialSearchResults.map((obraSocial) => (
                      <option key={obraSocial.id} value={obraSocial.id}>
                        {obraSocial.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {requiresPlanSelection ? (
                <div className={styles.fieldBlock}>
                  <label className={styles.fieldLabel} htmlFor="planId">
                    Seleccionar Plan *
                  </label>
                  <select
                    id="planId"
                    className={styles.selectorInput}
                    value={affiliationForm.planId}
                    onChange={(event) =>
                      handleAffiliationInputChange("planId", event.target.value)
                    }
                  >
                    <option value="">Seleccione un plan</option>
                    {availablePlanes.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className={styles.fieldBlock}>
                <label className={styles.fieldLabel} htmlFor="affiliateNumber">
                  Numero de Afiliado *
                </label>
                <input
                  id="affiliateNumber"
                  type="text"
                  value={affiliationForm.affiliateNumber}
                  onChange={(event) =>
                    handleAffiliationInputChange(
                      "affiliateNumber",
                      event.target.value,
                    )
                  }
                  className={styles.fieldInput}
                  placeholder="Ej: 123456789"
                />
              </div>

              <div className={styles.dateGrid}>
                <div className={styles.fieldBlock}>
                  <label className={styles.fieldLabel} htmlFor="startsAt">
                    Desde
                  </label>
                  <div className={styles.inputWithIcon}>
                    <input
                      id="startsAt"
                      type="date"
                      value={affiliationForm.startsAt}
                      onChange={(event) =>
                        handleAffiliationInputChange(
                          "startsAt",
                          event.target.value,
                        )
                      }
                      className={styles.fieldInput}
                    />
                    <CalendarDays size={18} className={styles.fieldIcon} />
                  </div>
                </div>

                <div className={styles.fieldBlock}>
                  <label className={styles.fieldLabel} htmlFor="endsAt">
                    Hasta
                  </label>
                  <div className={styles.inputWithIcon}>
                    <input
                      id="endsAt"
                      type="date"
                      value={affiliationForm.endsAt}
                      onChange={(event) =>
                        handleAffiliationInputChange(
                          "endsAt",
                          event.target.value,
                        )
                      }
                      className={styles.fieldInput}
                    />
                    <CalendarDays size={18} className={styles.fieldIcon} />
                  </div>
                </div>
              </div>

              <div className={styles.fieldBlock}>
                <label className={styles.fieldLabel} htmlFor="notes">
                  Notas
                </label>
                <textarea
                  id="notes"
                  value={affiliationForm.notes}
                  onChange={(event) =>
                    handleAffiliationInputChange("notes", event.target.value)
                  }
                  className={styles.fieldTextarea}
                  placeholder="Observaciones adicionales sobre la afiliacion"
                  rows={4}
                />
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={affiliationForm.isCurrent}
                    onChange={(event) =>
                      handleAffiliationInputChange(
                        "isCurrent",
                        event.target.checked,
                      )
                    }
                  />
                  Afiliacion vigente
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={affiliationForm.isHolder}
                    onChange={(event) =>
                      handleAffiliationInputChange(
                        "isHolder",
                        event.target.checked,
                      )
                    }
                  />
                  Es titular
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={affiliationForm.isPrimary}
                    onChange={(event) =>
                      handleAffiliationInputChange(
                        "isPrimary",
                        event.target.checked,
                      )
                    }
                  />
                  Marcar como afiliacion principal
                </label>
              </div>

              <footer className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={handleCloseAffiliationModal}
                  disabled={isSavingAffiliation}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryAction}
                  disabled={isAffiliationSubmitDisabled}
                >
                  {isSavingAffiliation ? "Guardando..." : "Guardar Afiliacion"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
