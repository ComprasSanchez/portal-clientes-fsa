"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Search, UserRound, X } from "lucide-react";
import { ProfileViewSkeleton } from "@/components/organisms/loading/ViewSkeletons";
import { ProfileField } from "@/components/molecules/home/ProfileField";
import { usePortalPerfilContext } from "@/lib/portal-perfil-context";
import {
  formatPortalProfileDate,
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
  firstName: string;
  lastName: string;
  displayNameFallback: string;
  fullName: string;
  birthDateValue: string;
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

type UpdateDatosPersonalesPayload = {
  nombre?: string;
  apellido?: string;
  fechaNacimiento?: string | null;
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

const PHONE_PREFIX = "+549";

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
  valor:
    tipo === "TELEFONO"
      ? (contacto?.valor ?? "").replace(PHONE_PREFIX, "")
      : (contacto?.valor ?? ""),
  regionIso2: contacto?.regionIso2 ?? "AR",
  principal: contacto?.principal ?? false,
  verificado: contacto?.verificado ?? false,
});

const getContactTypeLabel = (tipo: ContactType) => {
  return tipo === "TELEFONO" ? "Telefono" : "Email";
};

const normalizeOptionalString = (value: string) => {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizePhoneDigits = (value: string) => value.replace(/\D/g, "");

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
  const prefix = parts.length > 0 ? parts.join(" - ") : "Afiliacion";

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
      "La afiliacion seleccionada no tiene obra social y no se puede actualizar.",
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

const buildPersonalDisplayName = (
  firstName: string,
  lastName: string,
  fallback: string,
) => {
  const displayName = [firstName.trim(), lastName.trim()]
    .filter(Boolean)
    .join(" ");

  return displayName || fallback || "Usuario";
};

const syncProfileDerivedFields = (profileData: ProfileData): ProfileData => {
  const formattedAddress = formatEditableAddress(profileData);

  return {
    ...profileData,
    fullName: buildPersonalDisplayName(
      profileData.firstName,
      profileData.lastName,
      profileData.displayNameFallback,
    ),
    birthDate: formatPortalProfileDate(profileData.birthDateValue || null),
    legalAddress: formattedAddress,
    residenceAddress: formattedAddress,
  };
};

const buildProfileData = (perfil: PortalPerfilResponse | null): ProfileData => {
  const details = getPortalPerfilDetails(perfil);
  const domicilio = pickPreferredDomicilio(perfil?.domicilios);

  return syncProfileDerivedFields({
    firstName: perfil?.nombre ?? "",
    lastName: perfil?.apellido ?? "",
    displayNameFallback: details.displayName,
    fullName: details.displayName,
    birthDateValue: normalizeText(perfil?.fechaNacimiento) ?? "",
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
  const normalizedValue =
    formData.tipo === "TELEFONO"
      ? `${PHONE_PREFIX}${normalizePhoneDigits(formData.valor)}`
      : formData.valor.trim();

  if (
    !normalizedValue ||
    (formData.tipo === "TELEFONO" && normalizedValue === PHONE_PREFIX)
  ) {
    if (normalizeText(contacto?.valor)) {
      throw new Error(
        "Para eliminar un contacto existente todavia falta conectar la baja desde el portal.",
      );
    }

    return;
  }

  const payload = {
    tipo: formData.tipo,
    valor: normalizedValue,
    ...(contacto?.regionIso2 || formData.tipo === "TELEFONO"
      ? { regionIso2: "AR" }
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
      "Para guardar el domicilio completa calle, ciudad y provincia.",
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

const buildDatosPersonalesPatch = (
  initialProfile: ProfileData,
  currentProfile: ProfileData,
): UpdateDatosPersonalesPayload => {
  const payload: UpdateDatosPersonalesPayload = {};
  const initialFirstName = initialProfile.firstName.trim();
  const currentFirstName = currentProfile.firstName.trim();
  const initialLastName = initialProfile.lastName.trim();
  const currentLastName = currentProfile.lastName.trim();
  const initialBirthDate = initialProfile.birthDateValue.trim();
  const currentBirthDate = currentProfile.birthDateValue.trim();

  if (currentFirstName !== initialFirstName) {
    payload.nombre = currentFirstName;
  }

  if (currentLastName !== initialLastName) {
    payload.apellido = currentLastName;
  }

  if (currentBirthDate !== initialBirthDate) {
    payload.fechaNacimiento = currentBirthDate || null;
  }

  return payload;
};

const savePortalDatosPersonales = async (
  payload: UpdateDatosPersonalesPayload,
) => {
  const response = await fetch("/api/portal/me/datos-personales", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readMutationError(response));
  }

  return (await response.json()) as PortalPerfilResponse;
};

const setPortalDomicilioAsPrincipal = async (
  domicilio: PortalPerfilDomicilio,
) => {
  if (!domicilio.id) {
    throw new Error(
      "El domicilio seleccionado no tiene id y no se puede actualizar.",
    );
  }

  const nextProfile = syncProfileDerivedFields({
    firstName: "",
    lastName: "",
    displayNameFallback: "Usuario",
    fullName: "",
    birthDateValue: "",
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
  const { refresh, replacePerfil } = usePortalPerfilContext();
  const [isAffiliationModalOpen, setIsAffiliationModalOpen] = useState(false);
  const [activeContactEditorType, setActiveContactEditorType] =
    useState<ContactType | null>(null);
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
  const [isSavingContacto, setIsSavingContacto] = useState(false);
  const [isSwitchingDomicilio, setIsSwitchingDomicilio] = useState(false);
  const [isSavingDomicilio, setIsSavingDomicilio] = useState(false);
  const [isEditingPersonalData, setIsEditingPersonalData] = useState(false);
  const [isSavingPersonalData, setIsSavingPersonalData] = useState(false);
  const [profileFeedback, setProfileFeedback] =
    useState<ProfileFeedback | null>(null);
  const [isVerificacionModalOpen, setIsVerificacionModalOpen] = useState(false);
  const [verificandoContacto, setVerificandoContacto] =
    useState<PortalPerfilContacto | null>(null);
  const [otpStep, setOtpStep] = useState<
    "idle" | "sending" | "waiting_whatsapp"
  >("idle");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    if (otpStep !== "waiting_whatsapp" || !verificandoContacto?.id) return;

    const contactoId = verificandoContacto.id;

    pollingRef.current = setInterval(() => {
      void fetch("/api/portal/me/perfil", {
        headers: { Accept: "application/json" },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: PortalPerfilResponse | null) => {
          if (!data) return;
          const contacto = (data.contactos ?? []).find(
            (c) => c.id === contactoId,
          );
          if (contacto?.verificado) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setIsVerificacionModalOpen(false);
            setVerificandoContacto(null);
            setOtpStep("idle");
            void refresh();
          }
        })
        .catch(() => undefined);
    }, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [otpStep, verificandoContacto?.id, refresh]);

  useEffect(() => {
    if (otpStep !== "waiting_whatsapp") {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      setResendCooldown(0);
      return;
    }

    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [otpStep]);

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
    () =>
      (selectedObraSocial?.planes ?? []).filter(
        (plan) => plan.activo !== false,
      ),
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
    setActiveContactEditorType(tipo);
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

  const handleOpenVerificacionModal = (contacto: PortalPerfilContacto) => {
    setVerificandoContacto(contacto);
    setOtpStep("idle");
    setOtpError(null);
    setIsVerificacionModalOpen(true);
  };

  const handleCloseVerificacionModal = () => {
    if (otpStep === "sending") return;
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setIsVerificacionModalOpen(false);
    setVerificandoContacto(null);
    setOtpStep("idle");
    setOtpError(null);
    setResendCooldown(0);
  };

  const handleSolicitarOtp = async () => {
    if (!verificandoContacto?.id) return;
    setOtpStep("sending");
    setOtpError(null);
    try {
      if (
        verificandoContacto.tipo === "TELEFONO" &&
        verificandoContacto.valor?.startsWith("+54") &&
        !verificandoContacto.valor?.startsWith("+549")
      ) {
        const normalizedValor = "+549" + verificandoContacto.valor.slice(3);
        const patchRes = await fetch(
          `/api/portal/me/contactos/${verificandoContacto.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipo: "TELEFONO",
              valor: normalizedValor,
              regionIso2: "AR",
              principal: verificandoContacto.principal ?? false,
              verificado: verificandoContacto.verificado ?? false,
            }),
          },
        );
        if (!patchRes.ok) {
          setOtpError(
            "No se pudo normalizar el numero antes de verificar. Edita y guarda el telefono primero.",
          );
          setOtpStep("idle");
          return;
        }
      }

      const res = await fetch(
        `/api/portal/me/contactos/${verificandoContacto.id}/verificar`,
        { method: "POST", headers: { Accept: "application/json" } },
      );
      const data = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!res.ok) {
        setOtpError(
          data?.message ?? "No se pudo enviar el mensaje. Intenta de nuevo.",
        );
        setOtpStep("idle");
        return;
      }
      setOtpStep("waiting_whatsapp");
    } catch {
      setOtpError("Error de red. Intenta de nuevo.");
      setOtpStep("idle");
    }
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
          message: "No encontramos obras sociales para esa busqueda.",
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
        message: "La afiliacion se guardo correctamente.",
      });
      await refresh();
      handleCloseAffiliationModal();
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la afiliacion.",
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
          message: "Se quito la afiliacion principal del perfil.",
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
        message: "Afiliacion principal actualizada.",
      });
      await refresh();
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar la afiliacion principal.",
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
            ? "Ingresa un numero de telefono para guardarlo."
            : "Ingresa un email para guardarlo.",
      });
      return;
    }

    try {
      setIsSavingContacto(true);
      setProfileFeedback(null);
      await savePortalContact(null, {
        ...contactForm,
        principal: true,
        verificado: false,
      });
      setActiveContactEditorType(null);
      setProfileFeedback({
        type: "success",
        message: `${getContactTypeLabel(contactForm.tipo)} guardado como principal correctamente.`,
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

    const nextProfile = syncProfileDerivedFields({
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
        message: "Tu domicilio se guardo correctamente.",
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

  const handlePersonalDataFieldChange = (
    field: "firstName" | "lastName" | "birthDateValue",
    value: string,
  ) => {
    setEditableProfile((current) => {
      if (!current) {
        return current;
      }

      return syncProfileDerivedFields({
        ...current,
        [field]: value,
      });
    });
  };

  const handleStartEditingPersonalData = () => {
    setEditableProfile(profile);
    setProfileFeedback(null);
    setIsEditingPersonalData(true);
  };

  const handleCancelEditingPersonalData = () => {
    if (isSavingPersonalData) {
      return;
    }

    setEditableProfile(profile);
    setProfileFeedback(null);
    setIsEditingPersonalData(false);
  };

  const handleSavePersonalData = async () => {
    if (isSavingPersonalData || !editableProfile) {
      return;
    }

    const payload = buildDatosPersonalesPatch(profile, editableProfile);

    if (Object.keys(payload).length === 0) {
      setIsEditingPersonalData(false);
      setProfileFeedback(null);
      return;
    }

    if ("nombre" in payload && !payload.nombre) {
      setProfileFeedback({
        type: "error",
        message: "El nombre no puede quedar vacio.",
      });
      return;
    }

    if ("apellido" in payload && !payload.apellido) {
      setProfileFeedback({
        type: "error",
        message: "El apellido no puede quedar vacio.",
      });
      return;
    }

    try {
      setIsSavingPersonalData(true);
      setProfileFeedback(null);

      const updatedPerfil = await savePortalDatosPersonales(payload);
      replacePerfil(updatedPerfil);
      setEditableProfile(buildProfileData(updatedPerfil));
      setIsEditingPersonalData(false);
      setProfileFeedback({
        type: "success",
        message: "Tus datos personales se actualizaron correctamente.",
      });
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron guardar los datos personales.",
      });
    } finally {
      setIsSavingPersonalData(false);
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
          <h1 className={styles.title}>Mi perfil</h1>
          <p className={styles.subtitle}>Informacion personal y de contacto</p>
          <p className={styles.localEditHint}>
            Desde editar podes actualizar tus datos personales y tambien elegir
            o cargar nuevos datos de contacto y domicilio.
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
                <div className={styles.sectionHeader}>
                  <div>
                    <h3 className={styles.sectionTitle}>
                      Mis datos personales
                    </h3>
                    <p className={styles.sectionSubtitle}>
                      {isEditingPersonalData
                        ? "Edita tus datos personales y administra tus contactos desde este mismo bloque."
                        : "Consulta tus datos personales y abri editar para actualizar tambien tus contactos."}
                    </p>
                  </div>
                  <div className={styles.sectionActions}>
                    {isEditingPersonalData ? (
                      <>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={handleCancelEditingPersonalData}
                          disabled={isSavingPersonalData}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className={styles.selectorActionButton}
                          onClick={() => {
                            void handleSavePersonalData();
                          }}
                          disabled={isSavingPersonalData}
                        >
                          {isSavingPersonalData
                            ? "Guardando..."
                            : "Guardar cambios"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleStartEditingPersonalData}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
                <div className={styles.profileSectionGrid}>
                  <div className={styles.profileSectionColumn}>
                    <h4 className={styles.subsectionTitle}>Datos personales</h4>
                    <div className={styles.fieldsGrid}>
                      <ProfileField
                        label="Nombre"
                        value={
                          isEditingPersonalData
                            ? profileValues.firstName
                            : profileValues.firstName || "Sin dato"
                        }
                        isEditing={isEditingPersonalData}
                        onChange={(value) => {
                          handlePersonalDataFieldChange("firstName", value);
                        }}
                      />
                      <ProfileField
                        label="Apellido"
                        value={
                          isEditingPersonalData
                            ? profileValues.lastName
                            : profileValues.lastName || "Sin dato"
                        }
                        isEditing={isEditingPersonalData}
                        onChange={(value) => {
                          handlePersonalDataFieldChange("lastName", value);
                        }}
                      />
                      <ProfileField
                        label="Fecha de nacimiento"
                        value={
                          isEditingPersonalData
                            ? profileValues.birthDateValue
                            : profileValues.birthDate
                        }
                        type="date"
                        isEditing={isEditingPersonalData}
                        onChange={(value) => {
                          handlePersonalDataFieldChange(
                            "birthDateValue",
                            value,
                          );
                        }}
                      />
                      <ProfileField
                        label="Número de documento"
                        value={profileValues.identification}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className={styles.profileSectionColumn}>
                    <h4 className={styles.subsectionTitle}>
                      Datos de contacto
                    </h4>
                    {isEditingPersonalData ? (
                      <div className={styles.fieldsGrid}>
                        <div className={styles.selectorGroup}>
                          <label
                            className={styles.selectorLabel}
                            htmlFor="phone-principal"
                          >
                            Telefono principal
                          </label>
                          <div className={styles.selectorRow}>
                            {activeContactEditorType === "TELEFONO" ? (
                              <div className={styles.phoneInputRow}>
                                <span
                                  className={styles.phonePrefix}
                                  aria-hidden="true"
                                >
                                  {PHONE_PREFIX}
                                </span>
                                <input
                                  id="phone-principal"
                                  type="tel"
                                  inputMode="numeric"
                                  value={contactForm.valor}
                                  onChange={(event) =>
                                    handleContactFieldChange(
                                      "valor",
                                      normalizePhoneDigits(event.target.value),
                                    )
                                  }
                                  className={`${styles.fieldInput} ${styles.phoneValueInput}`}
                                  placeholder="3511234567"
                                />
                              </div>
                            ) : (
                              <input
                                id="phone-principal"
                                className={styles.selectorInput}
                                value={preferredPhone?.valor ?? "Sin dato"}
                                disabled
                                readOnly
                              />
                            )}
                            <button
                              type="button"
                              className={styles.selectorActionButton}
                              onClick={() => {
                                if (activeContactEditorType === "TELEFONO") {
                                  void handleSaveContacto({
                                    preventDefault() {},
                                  } as React.FormEvent<HTMLFormElement>);
                                  return;
                                }

                                handleOpenContactoModal(
                                  "TELEFONO",
                                  preferredPhone ?? null,
                                );
                              }}
                              disabled={isSavingContacto}
                            >
                              {activeContactEditorType === "TELEFONO"
                                ? "Guardar"
                                : "Editar"}
                            </button>
                          </div>
                          {telefonos.length === 0 ? (
                            <p className={styles.contactInlineHint}>
                              Todavia no hay telefonos guardados.
                            </p>
                          ) : null}
                          {preferredPhone && !preferredPhone.verificado ? (
                            <div className={styles.verificationHint}>
                              <span>
                                Este telefono principal aun no esta verificado.
                              </span>
                              <button
                                type="button"
                                className={styles.verificationAction}
                                onClick={() =>
                                  handleOpenVerificacionModal(preferredPhone)
                                }
                              >
                                Verificar telefono
                              </button>
                            </div>
                          ) : null}
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
                                    ? getDomicilioOptionValue(
                                        preferredDomicilio,
                                      )
                                    : ""
                                }
                                onChange={(event) =>
                                  void handleSelectPrincipalDomicilio(
                                    event.target.value,
                                  )
                                }
                                disabled={
                                  domicilios.length === 0 ||
                                  isSwitchingDomicilio
                                }
                              >
                                {domicilios.length === 0 ? (
                                  <option value="">
                                    No hay domicilios cargados
                                  </option>
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
                                Anadir nuevo domicilio
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className={styles.selectorGroup}>
                          <label
                            className={styles.selectorLabel}
                            htmlFor="email-principal"
                          >
                            Email principal
                          </label>
                          <div className={styles.selectorRow}>
                            <input
                              id="email-principal"
                              type="email"
                              className={
                                activeContactEditorType === "EMAIL"
                                  ? styles.fieldInput
                                  : styles.selectorInput
                              }
                              value={
                                activeContactEditorType === "EMAIL"
                                  ? contactForm.valor
                                  : (preferredEmail?.valor ?? "Sin dato")
                              }
                              onChange={(event) =>
                                activeContactEditorType === "EMAIL"
                                  ? handleContactFieldChange(
                                      "valor",
                                      event.target.value,
                                    )
                                  : undefined
                              }
                              disabled={activeContactEditorType !== "EMAIL"}
                              readOnly={activeContactEditorType !== "EMAIL"}
                              placeholder="usuario@email.com"
                            />
                            <button
                              type="button"
                              className={styles.selectorActionButton}
                              onClick={() => {
                                if (activeContactEditorType === "EMAIL") {
                                  void handleSaveContacto({
                                    preventDefault() {},
                                  } as React.FormEvent<HTMLFormElement>);
                                  return;
                                }

                                handleOpenContactoModal(
                                  "EMAIL",
                                  preferredEmail ?? null,
                                );
                              }}
                              disabled={isSavingContacto}
                            >
                              {activeContactEditorType === "EMAIL"
                                ? "Guardar"
                                : "Editar"}
                            </button>
                          </div>
                          {emails.length === 0 ? (
                            <p className={styles.contactInlineHint}>
                              Todavia no hay emails guardados.
                            </p>
                          ) : null}
                          {preferredEmail && !preferredEmail.verificado ? (
                            <div className={styles.verificationHint}>
                              <span>
                                Este email principal aun no esta verificado.
                              </span>
                              <button
                                type="button"
                                className={styles.verificationAction}
                                onClick={() =>
                                  handleOpenVerificacionModal(preferredEmail)
                                }
                              >
                                Verificar email
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.fieldsGrid}>
                        <ProfileField
                          label="Telefono principal"
                          value={preferredPhone?.valor ?? "Sin dato"}
                          readOnly
                        />
                        {preferredPhone && !preferredPhone.verificado ? (
                          <div className={styles.verificationHint}>
                            <span>Tu celular aun no esta verificado.</span>
                            <button
                              type="button"
                              className={styles.verificationAction}
                              onClick={() =>
                                handleOpenVerificacionModal(preferredPhone)
                              }
                            >
                              Verificar celular
                            </button>
                          </div>
                        ) : null}
                        <ProfileField
                          label="Email principal"
                          value={preferredEmail?.valor ?? "Sin dato"}
                          readOnly
                        />
                        {preferredEmail && !preferredEmail.verificado ? (
                          <div className={styles.verificationHint}>
                            <span>Tu email aun no esta verificado.</span>
                            <button
                              type="button"
                              className={styles.verificationAction}
                              onClick={() =>
                                handleOpenVerificacionModal(preferredEmail)
                              }
                            >
                              Verificar email
                            </button>
                          </div>
                        ) : null}
                        <ProfileField
                          label="Domicilio principal"
                          value={
                            preferredDomicilio
                              ? getDomicilioOptionLabel(preferredDomicilio)
                              : "Sin dato"
                          }
                          readOnly
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* <div
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
                    Elegir afiliacion principal
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
                      <option value="">Sin afiliacion principal</option>
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
                        ? "Agregar nueva afiliacion"
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
                    Elegir afiliacion principal
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
                      <option value="">Sin afiliacion principal</option>
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
                        ? "Agregar nueva afiliacion"
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
        </div> */}
      </article>

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
                  Anadir nuevo domicilio
                </h2>
                <p className={styles.modalSubtitle}>
                  Carga un domicilio nuevo para guardarlo como principal en el
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
                        planId: activePlanes.some(
                          (plan) => plan.id === current.planId,
                        )
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
      {isVerificacionModalOpen && verificandoContacto ? (
        <div
          className={styles.modalOverlay}
          onClick={handleCloseVerificacionModal}
        >
          <div
            className={styles.modalDialog}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="verificacion-modal-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <h2 id="verificacion-modal-title" className={styles.modalTitle}>
                  {verificandoContacto?.tipo === "EMAIL"
                    ? "Verificar email"
                    : "Verificar contacto"}
                </h2>
                <p className={styles.modalSubtitle}>
                  {verificandoContacto?.valor ??
                    (verificandoContacto?.tipo === "EMAIL"
                      ? "Tu email"
                      : "Tu contacto")}
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={handleCloseVerificacionModal}
                aria-label="Cerrar"
                disabled={otpStep === "sending"}
              >
                <X size={22} />
              </button>
            </header>

            <div className={styles.modalForm}>
              {otpStep === "waiting_whatsapp" ? (
                <div className={styles.fieldBlock}>
                  <p className={styles.fieldLabel}>
                    {verificandoContacto?.tipo === "EMAIL" ? (
                      <>
                        Te enviamos un mensaje a{" "}
                        <strong>
                          {verificandoContacto.valor ?? "tu email"}
                        </strong>
                        . Segui las instrucciones para confirmar este contacto.
                      </>
                    ) : (
                      <>
                        Te enviamos un mensaje de WhatsApp a{" "}
                        <strong>
                          {verificandoContacto?.valor ?? "tu celular"}
                        </strong>
                        . Toca el boton <strong>Validar</strong> en ese mensaje
                        para confirmar tu numero.
                      </>
                    )}
                  </p>
                  <p
                    className={styles.fieldLabel}
                    style={{
                      marginTop: "0.5rem",
                      opacity: 0.6,
                      fontSize: "0.85em",
                    }}
                  >
                    Esperando confirmacion...
                  </p>
                  {otpError ? (
                    <p className={styles.profileFeedbackError}>{otpError}</p>
                  ) : null}
                </div>
              ) : (
                <div className={styles.fieldBlock}>
                  <p className={styles.fieldLabel}>
                    {verificandoContacto?.tipo === "EMAIL"
                      ? "Te enviaremos un email para confirmar que te pertenece."
                      : "Te enviaremos un mensaje de WhatsApp a tu celular para confirmar que es tuyo."}
                  </p>
                  {otpError ? (
                    <p className={styles.profileFeedbackError}>{otpError}</p>
                  ) : null}
                </div>
              )}

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={handleCloseVerificacionModal}
                  disabled={otpStep === "sending"}
                >
                  Cancelar
                </button>
                {otpStep === "waiting_whatsapp" ? (
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={() => void handleSolicitarOtp()}
                    disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0
                      ? `Reenviar en ${resendCooldown}s`
                      : "Reenviar mensaje"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={() => void handleSolicitarOtp()}
                    disabled={otpStep === "sending"}
                  >
                    {otpStep === "sending" ? "Enviando..." : "Enviar mensaje"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
