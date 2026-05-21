"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CalendarDays, FilePenLine, FilePlus2, RotateCcw, ShieldCheck } from "lucide-react";
import { useGlobalToast } from "@/components/ui/global-toast";
import { usePortalExpedienteActual } from "@/lib/use-portal-expediente-actual";
import {
  formatPortalProfileDate,
  normalizeText,
  pickPreferredAfiliacion,
  pickPreferredContacto,
  pickPreferredDomicilio,
} from "@/lib/portal-profile";
import type {
  PortalExpedienteItem,
  PortalExpedientesResponse,
} from "@/types/portal-expedientes";
import type {
  PortalPerfilAfiliacion,
  PortalPerfilContacto,
  PortalPerfilDomicilio,
  PortalPerfilResponse,
} from "@/types/portal-profile";
import type {
  PortalProductoOption,
  PortalProductosResponse,
} from "@/types/portal-productos";
import type { PortalSucursalOption } from "@/types/portal-sucursales";
import type {
  PortalCreateExpedienteRequest,
  PortalCreateExpedienteResponse,
  PortalUpdateExpedienteRequest,
} from "@/types/portal-expediente-mutations";

type ExpedientesManagementViewProps = {
  perfil: PortalPerfilResponse | null;
  expedientes: PortalExpedienteItem[];
  activeExpedienteId: string | null;
  refreshExpedientes: () => Promise<PortalExpedientesResponse | null>;
};

type ExpedienteFormState = {
  titulo: string;
  contactoId: string;
  afiliacionOSId: string;
  medioEntrega: string;
  domicilioEntregaId: string;
  sucursalEntregaId: string;
  medioPago: string;
  fechaInicioCicloBase: string;
  fechaObjetivoEntrega: string;
};

type SelectedProductState = PortalProductoOption & {
  periodoDias: string;
};

type CreatedExpedienteSummary = {
  expedienteId: string;
  fechaObjetivoEntrega: string | null;
  fechaPrimerContacto: string | null;
};

const DELIVERY_OPTIONS = [
  { value: "", label: "Seleccioná una forma de entrega" },
  { value: "ENVIO_DOMICILIO", label: "Envío a domicilio" },
  { value: "RETIRA_SUCURSAL", label: "Retira en sucursal" },
] as const;

const PAYMENT_OPTIONS = [
  { value: "", label: "Seleccioná una forma de pago" },
  { value: "CUENTA_CORRIENTE", label: "Cuenta corriente" },
  { value: "OBRA_SOCIAL", label: "Obra social" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "EFECTIVO", label: "Efectivo" },
] as const;

const toInputDate = (value?: string | null) => {
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

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatExpedienteLabel = (expedienteId: string) => {
  const compact = expedienteId.replaceAll("-", "");
  return `Expediente ${compact.slice(0, 8).toUpperCase()}`;
};

const normalizeProductResult = (value: Record<string, unknown>): PortalProductoOption => ({
  id: String(value.id ?? value.productoIdOrSkuExt ?? ""),
  nombre: String(value.nombre ?? value.productoNombre ?? "Producto sin nombre"),
  laboratorio: String(value.lab ?? value.marcaNombre ?? "Laboratorio sin dato"),
  presentacion:
    typeof value.presentacion === "string" ? value.presentacion : undefined,
});

const normalizeSucursalResult = (value: Record<string, unknown>): PortalSucursalOption => ({
  id: Number(value.id ?? value.cod_sucursal ?? 0),
  nombre: String(value.nombre ?? "Sucursal sin nombre"),
  direccion: String(value.direccion ?? "Sin direccion"),
  telefono: typeof value.telefono === "string" ? value.telefono : null,
  empresa_id: typeof value.empresa_id === "number" ? value.empresa_id : undefined,
  formato_id: typeof value.formato_id === "number" ? value.formato_id : undefined,
  cod_sucursal: typeof value.cod_sucursal === "number" ? value.cod_sucursal : undefined,
  latitud: typeof value.latitud === "number" ? value.latitud : null,
  longitud: typeof value.longitud === "number" ? value.longitud : null,
  tolerancia_metros:
    typeof value.tolerancia_metros === "number" ? value.tolerancia_metros : null,
});

const getContactoLabel = (contacto: PortalPerfilContacto) => {
  const tipo = contacto.tipo === "EMAIL" ? "Email" : "Teléfono";
  const valor = normalizeText(contacto.valor) ?? "Sin dato";
  const suffix = contacto.verificado ? "Verificado" : "No verificado";

  return `${tipo}: ${valor} · ${suffix}`;
};

const getAfiliacionLabel = (afiliacion: PortalPerfilAfiliacion) => {
  const obraSocial = normalizeText(afiliacion.obraSocialNombre) ?? "Obra social";
  const plan = normalizeText(afiliacion.planNombre);
  const nroAfiliado = normalizeText(afiliacion.nroAfiliado);
  const parts = [obraSocial, plan, nroAfiliado ? `N° ${nroAfiliado}` : null].filter(Boolean);

  return parts.join(" · ");
};

const getDomicilioValue = (domicilio: PortalPerfilDomicilio) =>
  domicilio.id ??
  [domicilio.calle, domicilio.numero, domicilio.ciudad, domicilio.provincia]
    .filter(Boolean)
    .join("|");

const getDomicilioLabel = (domicilio: PortalPerfilDomicilio) => {
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

const buildCreateDefaults = (params: {
  verifiedContacts: PortalPerfilContacto[];
  preferredAfiliacionId: string;
  preferredDomicilioId: string;
}): ExpedienteFormState => ({
  titulo: "",
  contactoId: params.verifiedContacts[0]?.id ?? "",
  afiliacionOSId: params.preferredAfiliacionId,
  medioEntrega: "",
  domicilioEntregaId: params.preferredDomicilioId,
  sucursalEntregaId: "",
  medioPago: "",
  fechaInicioCicloBase: todayIso(),
  fechaObjetivoEntrega: "",
});

const buildEditDefaults = (): ExpedienteFormState => ({
  titulo: "",
  contactoId: "",
  afiliacionOSId: "",
  medioEntrega: "",
  domicilioEntregaId: "",
  sucursalEntregaId: "",
  medioPago: "",
  fechaInicioCicloBase: "",
  fechaObjetivoEntrega: "",
});

let allSucursalesCache: PortalSucursalOption[] | null = null;

const normalizeSucursalesData = (data: unknown): PortalSucursalOption[] => {
  const objectPayload =
    data && !Array.isArray(data) && typeof data === "object"
      ? (data as { sucursales?: unknown[]; items?: unknown[]; data?: unknown[] })
      : null;

  const rawList: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray(objectPayload?.sucursales)
      ? objectPayload.sucursales
      : Array.isArray(objectPayload?.items)
        ? objectPayload.items
        : Array.isArray(objectPayload?.data)
          ? objectPayload.data
          : [];

  return rawList
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map(normalizeSucursalResult)
    .filter((item) => Number.isInteger(item.id) && item.id > 0);
};

export function ExpedientesManagementView({
  perfil,
  expedientes,
  activeExpedienteId,
  refreshExpedientes,
}: ExpedientesManagementViewProps) {
  const { pushToast } = useGlobalToast();
  const {
    expediente,
    currentCycle,
    sucursalEntrega,
    isLoading: isLoadingExpedienteActual,
    error: expedienteActualError,
    isNotFound: expedienteActualNotFound,
    refresh: refreshExpedienteActual,
  } = usePortalExpedienteActual({ enabled: true });

  const contactos = useMemo(
    () => (Array.isArray(perfil?.contactos) ? perfil.contactos : []),
    [perfil],
  );
  const afiliaciones = useMemo(
    () => (Array.isArray(perfil?.afiliaciones) ? perfil.afiliaciones : []),
    [perfil],
  );
  const domicilios = useMemo(
    () => (Array.isArray(perfil?.domicilios) ? perfil.domicilios : []),
    [perfil],
  );
  const verifiedContacts = useMemo(
    () => contactos.filter((contacto) => contacto.id && contacto.verificado === true),
    [contactos],
  );
  const preferredVerifiedContact = useMemo(() => {
    const preferredEmail = pickPreferredContacto(verifiedContacts, "EMAIL");
    const preferredPhone = pickPreferredContacto(verifiedContacts, "TELEFONO");

    return preferredPhone ?? preferredEmail ?? verifiedContacts[0] ?? null;
  }, [verifiedContacts]);
  const preferredAfiliacion = useMemo(() => pickPreferredAfiliacion(afiliaciones), [afiliaciones]);
  const preferredAfiliacionId = preferredAfiliacion?.obraSocialId ?? "";
  const preferredDomicilio = useMemo(() => pickPreferredDomicilio(domicilios), [domicilios]);
  const preferredDomicilioId = preferredDomicilio?.id ?? "";

  const [createForm, setCreateForm] = useState<ExpedienteFormState>(() =>
    buildCreateDefaults({
      verifiedContacts,
      preferredAfiliacionId,
      preferredDomicilioId,
    }),
  );
  const [editForm, setEditForm] = useState<ExpedienteFormState>(buildEditDefaults);
  const [editFormOriginal, setEditFormOriginal] = useState<ExpedienteFormState | null>(null);
  const [editExpedienteId, setEditExpedienteId] = useState<string | null>(activeExpedienteId);
  const isUserEditingRef = useRef(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingCurrent, setIsUpdatingCurrent] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<PortalProductoOption[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductState[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [hasSearchedProducts, setHasSearchedProducts] = useState(false);
  const [createSucursalQuery, setCreateSucursalQuery] = useState("");
  const [selectedCreateSucursal, setSelectedCreateSucursal] = useState<PortalSucursalOption | null>(null);
  const [showCreateSucursalDropdown, setShowCreateSucursalDropdown] = useState(false);
  const [editSucursalQuery, setEditSucursalQuery] = useState("");
  const [selectedEditSucursal, setSelectedEditSucursal] = useState<PortalSucursalOption | null>(null);
  const [showEditSucursalDropdown, setShowEditSucursalDropdown] = useState(false);
  const [allSucursales, setAllSucursales] = useState<PortalSucursalOption[]>(allSucursalesCache ?? []);
  const [isLoadingSucursales, setIsLoadingSucursales] = useState(!allSucursalesCache);
  const [createdSummary, setCreatedSummary] =
    useState<CreatedExpedienteSummary | null>(null);

  useEffect(() => {
    setCreateForm((current) => {
      const nextContactId =
        current.contactoId || preferredVerifiedContact?.id || verifiedContacts[0]?.id || "";
      const nextAfiliacionId = current.afiliacionOSId || preferredAfiliacionId;
      const nextDomicilioId = current.domicilioEntregaId || preferredDomicilioId;

      return {
        ...current,
        contactoId: nextContactId,
        afiliacionOSId: nextAfiliacionId,
        domicilioEntregaId: nextDomicilioId,
      };
    });
  }, [preferredAfiliacionId, preferredDomicilioId, preferredVerifiedContact?.id, verifiedContacts]);

  useEffect(() => {
    if (!expediente) return;
    if (isUserEditingRef.current) return;

    setEditExpedienteId(expediente.id ?? activeExpedienteId);
    const nextEditForm = {
      titulo: expediente.titulo ?? "",
      contactoId: expediente.contactoId ?? preferredVerifiedContact?.id ?? "",
      afiliacionOSId: expediente.afiliacionOSId ?? preferredAfiliacionId,
      medioEntrega: expediente.medioEntrega ?? "",
      domicilioEntregaId: expediente.domicilioEntregaId ?? preferredDomicilioId,
      sucursalEntregaId:
        expediente.sucursalEntregaId !== null && expediente.sucursalEntregaId !== undefined
          ? String(expediente.sucursalEntregaId)
          : "",
      medioPago: expediente.medioPago ?? "",
      fechaInicioCicloBase: toInputDate(expediente.fechaInicioCicloBase),
      fechaObjetivoEntrega: toInputDate(expediente.proximaFechaEntregaForzada),
    };
    setEditForm(nextEditForm);
    setEditFormOriginal(nextEditForm);
    setSelectedEditSucursal(sucursalEntrega);
    setEditSucursalQuery("");
    setShowEditSucursalDropdown(false);
  }, [
    expediente,
    preferredDomicilioId,
    preferredAfiliacionId,
    preferredVerifiedContact?.id,
    sucursalEntrega,
  ]);

  useEffect(() => {
    if (!createdSummary) {
      return;
    }

    const stillExists = expedientes.some(
      (item) => item.expedienteId === createdSummary.expedienteId,
    );

    if (!stillExists) {
      setCreatedSummary(null);
    }
  }, [createdSummary, expedientes]);

  const hasVerifiedContact = verifiedContacts.length > 0;

  const validateForm = (
    form: ExpedienteFormState,
    options?: { requireProducts?: boolean },
  ) => {
    if (!hasVerifiedContact) {
      return "Necesitás un contacto verificado antes de crear o editar un expediente.";
    }

    if (!form.titulo.trim()) {
      return "Ingresá un título para el expediente.";
    }

    if (!form.contactoId) {
      return "Seleccioná un contacto verificado.";
    }

    if (!verifiedContacts.some((contacto) => contacto.id === form.contactoId)) {
      return "El contacto seleccionado debe estar verificado.";
    }

    if (!form.medioEntrega) {
      return "SeleccionÃ¡ una forma de entrega.";
    }

    if (form.medioEntrega === "ENVIO_DOMICILIO" && !form.domicilioEntregaId) {
      return "SeleccionÃ¡ un domicilio para la entrega.";
    }

    if (form.medioEntrega === "RETIRA_SUCURSAL" && !form.sucursalEntregaId) {
      return "SeleccionÃ¡ una sucursal para el retiro.";
    }

    if (!form.fechaInicioCicloBase) {
      return "Ingresá la fecha de inicio del ciclo.";
    }

    if (form.fechaObjetivoEntrega && form.fechaObjetivoEntrega < todayIso()) {
      return "La fecha objetivo de entrega no puede ser anterior a hoy.";
    }

    if (options?.requireProducts && selectedProducts.length === 0) {
      return "Seleccioná al menos un producto para crear el expediente.";
    }

    if (
      options?.requireProducts &&
      selectedProducts.some((product) => {
        const parsed = Number(product.periodoDias);
        return !Number.isInteger(parsed) || parsed <= 0;
      })
    ) {
      return "Cada producto debe tener una cadencia válida en días.";
    }

    return null;
  };

  const handleCreateFieldChange = (field: keyof ExpedienteFormState, value: string) => {
    if (field === "medioEntrega") {
      setCreateForm((current) => ({
        ...current,
        medioEntrega: value,
        domicilioEntregaId:
          value === "ENVIO_DOMICILIO"
            ? current.domicilioEntregaId || preferredDomicilioId
            : "",
        sucursalEntregaId: value === "RETIRA_SUCURSAL" ? current.sucursalEntregaId : "",
      }));

      if (value !== "RETIRA_SUCURSAL") {
        setSelectedCreateSucursal(null);
        setCreateSucursalQuery("");
        setShowCreateSucursalDropdown(false);
      }

      return;
    }

    setCreateForm((current) => ({ ...current, [field]: value }));
  };

  const handleEditFieldChange = (field: keyof ExpedienteFormState, value: string) => {
    if (field === "medioEntrega") {
      setEditForm((current) => ({
        ...current,
        medioEntrega: value,
        domicilioEntregaId:
          value === "ENVIO_DOMICILIO"
            ? current.domicilioEntregaId || preferredDomicilioId
            : "",
        sucursalEntregaId: value === "RETIRA_SUCURSAL" ? current.sucursalEntregaId : "",
      }));

      if (value !== "RETIRA_SUCURSAL") {
        setSelectedEditSucursal(null);
        setEditSucursalQuery("");
        setShowEditSucursalDropdown(false);
      }

      return;
    }

    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const handleSelectExpedienteForEdit = (item: PortalExpedienteItem) => {
    isUserEditingRef.current = true;
    setEditExpedienteId(item.expedienteId);
    const nextEditForm = {
      titulo: item.titulo ?? "",
      contactoId: item.contactoId ?? preferredVerifiedContact?.id ?? "",
      afiliacionOSId: item.afiliacionOSId ?? preferredAfiliacionId,
      medioEntrega: item.medioEntrega ?? "",
      domicilioEntregaId: item.domicilioEntregaId ?? preferredDomicilioId,
      sucursalEntregaId: item.sucursalEntregaId != null ? String(item.sucursalEntregaId) : "",
      medioPago: item.medioPago ?? "",
      fechaInicioCicloBase: toInputDate(item.openedAt),
      fechaObjetivoEntrega: toInputDate(item.nextActionAt),
    };
    setEditForm(nextEditForm);
    setEditFormOriginal(nextEditForm);
    setSelectedEditSucursal(null);
    setEditSucursalQuery("");
    setShowEditSucursalDropdown(false);
  };

  useEffect(() => {
    if (allSucursalesCache) return;
    setIsLoadingSucursales(true);
    fetch("/api/portal/me/sucursales/search?q=&limit=500", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return;
        const data: unknown = await res.json().catch(() => null);
        const normalized = normalizeSucursalesData(data);
        allSucursalesCache = normalized;
        setAllSucursales(normalized);
      })
      .catch(() => {})
      .finally(() => setIsLoadingSucursales(false));
  }, []);

  const filteredCreateSucursales = useMemo(() => {
    const term = createSucursalQuery.trim().toLowerCase();
    if (!term) return allSucursales;
    return allSucursales.filter(
      (s) =>
        s.nombre.toLowerCase().includes(term) ||
        s.direccion.toLowerCase().includes(term),
    );
  }, [allSucursales, createSucursalQuery]);

  const filteredEditSucursales = useMemo(() => {
    const term = editSucursalQuery.trim().toLowerCase();
    if (!term) return allSucursales;
    return allSucursales.filter(
      (s) =>
        s.nombre.toLowerCase().includes(term) ||
        s.direccion.toLowerCase().includes(term),
    );
  }, [allSucursales, editSucursalQuery]);

  const hasEditChanges = useMemo(() => {
    if (!editFormOriginal) return false;
    return (Object.keys(editForm) as (keyof ExpedienteFormState)[]).some(
      (key) => editForm[key] !== editFormOriginal[key],
    );
  }, [editForm, editFormOriginal]);

  const handleSearchProducts = async () => {
    const term = productQuery.trim();
    setHasSearchedProducts(true);

    if (!term) {
      setProductResults([]);
      return;
    }

    try {
      setIsSearchingProducts(true);
      const params = new URLSearchParams({
        busqueda: term,
        paginanro: "1",
        paginacant: "10",
      });
      const response = await fetch(`/api/portal/me/productos?${params.toString()}`, {
        cache: "no-store",
      });

      const data = (await response.json().catch(() => null)) as PortalProductosResponse | {
        error?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          (data && "message" in data && data.message) ||
            (data && "error" in data && data.error) ||
            "No pudimos buscar productos.",
        );
      }

      const responsePayload =
        data && "data" in data ? (data as PortalProductosResponse) : null;

      const rawList = Array.isArray(responsePayload?.data)
        ? responsePayload.data
        : responsePayload?.data
          ? [responsePayload.data]
          : [];

      setProductResults(
        rawList
          .filter(
            (item: unknown): item is Record<string, unknown> =>
              Boolean(item && typeof item === "object"),
          )
          .map(normalizeProductResult)
          .filter((item: PortalProductoOption) => item.id.trim().length > 0),
      );
    } catch (error) {
      setProductResults([]);
      pushToast({
        title: "No pudimos buscar productos",
        description:
          error instanceof Error ? error.message : "Ocurrió un error inesperado.",
        variant: "error",
      });
    } finally {
      setIsSearchingProducts(false);
    }
  };

  const handleAddProduct = (product: PortalProductoOption) => {
    setSelectedProducts((current) => {
      if (current.some((item) => item.id === product.id)) {
        return current;
      }

      return [...current, { ...product, periodoDias: "30" }];
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((current) => current.filter((item) => item.id !== productId));
  };

  const handleProductPeriodChange = (productId: string, value: string) => {
    setSelectedProducts((current) =>
      current.map((item) =>
        item.id === productId ? { ...item, periodoDias: value } : item,
      ),
    );
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm(createForm, { requireProducts: true });
    if (validationError) {
      pushToast({
        title: "No pudimos crear el expediente",
        description: validationError,
        variant: "error",
      });
      return;
    }

    const payload: PortalCreateExpedienteRequest = {
      titulo: createForm.titulo.trim(),
      contactoId: createForm.contactoId || null,
      afiliacionOSId: createForm.afiliacionOSId || null,
      medioEntrega: createForm.medioEntrega || null,
      domicilioEntregaId:
        createForm.medioEntrega === "ENVIO_DOMICILIO"
          ? createForm.domicilioEntregaId || null
          : null,
      sucursalEntregaId:
        createForm.medioEntrega === "RETIRA_SUCURSAL" && createForm.sucursalEntregaId
          ? Number(createForm.sucursalEntregaId)
          : null,
      medioPago: createForm.medioPago || null,
      fechaInicioCicloBase: createForm.fechaInicioCicloBase || null,
      proximaFechaEntregaForzada: createForm.fechaObjetivoEntrega || null,
      items: selectedProducts.map((product) => ({
        productoIdOrSkuExt: product.id,
        productoNombre: product.nombre,
        marcaNombre: product.laboratorio,
        activo: true,
        periodoDias: Number(product.periodoDias),
      })),
    };

    try {
      setIsCreating(true);

      const response = await fetch("/api/portal/me/expedientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (response.headers.get("content-type") || "").includes("application/json")
        ? ((await response.json().catch(() => null)) as PortalCreateExpedienteResponse | { error?: string; message?: string } | null)
        : null;

      if (!response.ok) {
        const message =
          (data && "message" in data && typeof data.message === "string" && data.message) ||
          (data && "error" in data && typeof data.error === "string" && data.error) ||
          "No pudimos crear el expediente.";
        throw new Error(message);
      }

      const createResult =
        data && "expedienteId" in data
          ? (data as PortalCreateExpedienteResponse)
          : null;

      pushToast({
        title: "Expediente creado",
        description: "La solicitud se envió correctamente. Vamos a refrescar tus expedientes.",
        variant: "success",
      });

      setCreateForm(
        buildCreateDefaults({
          verifiedContacts,
          preferredAfiliacionId,
          preferredDomicilioId,
        }),
      );
      setSelectedProducts([]);
      setProductResults([]);
      setProductQuery("");
      setHasSearchedProducts(false);
      setCreateSucursalQuery("");
      setSelectedCreateSucursal(null);
      setShowCreateSucursalDropdown(false);

      const [expedientesData] = await Promise.all([
        refreshExpedientes(),
        refreshExpedienteActual(),
      ]);

      const createdExpediente =
        expedientesData?.data.items.find(
          (item) => item.expedienteId === createResult?.expedienteId,
        ) ?? null;

      setCreatedSummary({
        expedienteId: createResult?.expedienteId ?? "",
        fechaObjetivoEntrega:
          createdExpediente?.cicloActual?.fechaEntregaObjetivo ??
          payload.proximaFechaEntregaForzada ??
          null,
        fechaPrimerContacto:
          createdExpediente?.cicloActual?.fechaInicioGestion ?? null,
      });
    } catch (error) {
      pushToast({
        title: "No pudimos crear el expediente",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
        variant: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCurrent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const targetExpedienteId = editExpedienteId ?? expediente?.id;
    if (!targetExpedienteId) {
      pushToast({
        title: "No hay expediente seleccionado para editar",
        description: "Seleccioná un expediente de la lista para poder editarlo.",
        variant: "error",
      });
      return;
    }

    const validationError = validateForm(editForm);
    if (validationError) {
      pushToast({
        title: "No pudimos actualizar el expediente",
        description: validationError,
        variant: "error",
      });
      return;
    }

    const payload: PortalUpdateExpedienteRequest = {
      titulo: editForm.titulo.trim(),
      contactoId: editForm.contactoId || null,
      afiliacionOSId: editForm.afiliacionOSId || null,
      medioEntrega: editForm.medioEntrega || null,
      domicilioEntregaId:
        editForm.medioEntrega === "ENVIO_DOMICILIO"
          ? editForm.domicilioEntregaId || null
          : null,
      sucursalEntregaId:
        editForm.medioEntrega === "RETIRA_SUCURSAL" && editForm.sucursalEntregaId
          ? Number(editForm.sucursalEntregaId)
          : null,
      medioPago: editForm.medioPago || null,
      proximaFechaEntregaForzada: editForm.fechaObjetivoEntrega || null,
    };

    try {
      setIsUpdatingCurrent(true);

      const response = await fetch(`/api/portal/me/expedientes/${targetExpedienteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (response.headers.get("content-type") || "").includes("application/json")
        ? ((await response.json().catch(() => null)) as { error?: string; message?: string } | null)
        : null;

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "No pudimos actualizar el expediente actual.",
        );
      }

      pushToast({
        title: "Expediente actualizado",
        description: "Actualizamos los datos del expediente activo.",
        variant: "success",
      });

      setEditFormOriginal({ ...editForm });
      await Promise.all([refreshExpedientes(), refreshExpedienteActual()]);
    } catch (error) {
      pushToast({
        title: "No pudimos actualizar el expediente",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
        variant: "error",
      });
    } finally {
      setIsUpdatingCurrent(false);
    }
  };

  const editingItem = expedientes.find((e) => e.expedienteId === editExpedienteId) ?? null;
  const canShowEditForm = editingItem !== null || (!!expediente && !isLoadingExpedienteActual);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-[#ebe6f4] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8f63d9]">
          Gestión de expedientes
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[#2f3042]">Crear y administrar tus expedientes</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f6074]">
          Desde aquí podés crear un expediente para gestionar tu tratamiento crónico, actualizar los datos de cada
          expediente y hacer seguimiento de las fechas de entrega.
        </p>
      </div>

      {createdSummary ? (
        <article className="rounded-3xl border border-[#dcd0f4] bg-[#faf7ff] p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8f63d9]">
            Alta confirmada
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[#2f3042]">
            Tu expediente ya fue creado
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f63d9]">
                Expediente
              </p>
              <p className="mt-1 text-sm font-semibold text-[#2f3042]">
                {formatExpedienteLabel(createdSummary.expedienteId)}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f63d9]">
                Fecha objetivo
              </p>
              <p className="mt-1 text-sm font-semibold text-[#2f3042]">
                {formatPortalProfileDate(createdSummary.fechaObjetivoEntrega)}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f63d9]">
                Primer contacto estimado
              </p>
              <p className="mt-1 text-sm font-semibold text-[#2f3042]">
                {createdSummary.fechaPrimerContacto
                  ? formatPortalProfileDate(createdSummary.fechaPrimerContacto)
                  : "Te vamos a confirmar pronto la fecha de contacto"}
              </p>
            </div>
          </div>
        </article>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-3xl border border-[#ebe6f4] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className={`rounded-2xl p-3 ${hasVerifiedContact ? "bg-[#eef9f1] text-[#22643a]" : "bg-[#fff3f4] text-[#a53c52]"}`}>
              <ShieldCheck size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#2f3042]">Contacto verificado</p>
              <p className="mt-1 text-sm text-[#5f6074]">
                {hasVerifiedContact
                  ? "Podemos comunicarnos con vos para coordinar cada entrega. Asegurate de tener tu teléfono o email siempre actualizados."
                  : "Necesitás verificar al menos un teléfono o email antes de crear un expediente. Podés hacerlo desde tu perfil."}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-[#ebe6f4] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-[#f6f2ff] p-3 text-[#8f63d9]">
              <CalendarDays size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#2f3042]">Fecha de entrega estimada</p>
              <p className="mt-1 text-sm text-[#5f6074]">
                Indicá cuándo necesitás recibir tu medicación. Usamos esa fecha para coordinar el despacho y avisarte con anticipación.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-[#ebe6f4] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-[#fff9ec] p-3 text-[#a66a00]">
              <AlertCircle size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#2f3042]">¿Qué pasa después?</p>
              <p className="mt-1 text-sm text-[#5f6074]">
                Una vez creado el expediente, un asesor se pondrá en contacto para confirmar los detalles y coordinar tu primera entrega.
              </p>
            </div>
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-[#ebe6f4] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-2xl bg-[#f6f2ff] p-3 text-[#8f63d9]">
              <FilePlus2 size={20} />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-[#2f3042]">Crear nuevo expediente</h3>
              <p className="text-sm text-[#5f6074]">
                Elegí los productos del tratamiento y definí la cadencia en días para cada uno.
              </p>
            </div>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#2f3042]">Título del expediente</span>
              <input
                className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                value={createForm.titulo}
                onChange={(event) => handleCreateFieldChange("titulo", event.target.value)}
                placeholder="Ej: Tratamiento crónico"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#2f3042]">Contacto verificado</span>
              <select
                className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                value={createForm.contactoId}
                onChange={(event) => handleCreateFieldChange("contactoId", event.target.value)}
              >
                <option value="">Seleccioná un contacto</option>
                {verifiedContacts.map((contacto) => (
                  <option key={contacto.id} value={contacto.id}>
                    {getContactoLabel(contacto)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#2f3042]">Afiliación</span>
              <select
                className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                value={createForm.afiliacionOSId}
                onChange={(event) => handleCreateFieldChange("afiliacionOSId", event.target.value)}
              >
                <option value="">Sin afiliación</option>
                {afiliaciones.map((afiliacion, index) => {
                  const optionValue =
                    afiliacion.obraSocialId ??
                    `${afiliacion.planId ?? "plan"}-${index}`;

                  return (
                    <option key={optionValue} value={afiliacion.obraSocialId ?? ""}>
                      {getAfiliacionLabel(afiliacion)}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#2f3042]">Forma de entrega</span>
              <select
                className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                value={createForm.medioEntrega}
                onChange={(event) => handleCreateFieldChange("medioEntrega", event.target.value)}
              >
                {DELIVERY_OPTIONS.map((option) => (
                  <option key={option.value || "empty"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {createForm.medioEntrega === "ENVIO_DOMICILIO" ? (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#2f3042]">Domicilio de entrega</span>
                <select
                  className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                  value={createForm.domicilioEntregaId}
                  onChange={(event) =>
                    handleCreateFieldChange("domicilioEntregaId", event.target.value)
                  }
                >
                  <option value="">SeleccionÃ¡ un domicilio</option>
                  {domicilios.map((domicilio) => (
                    <option key={getDomicilioValue(domicilio)} value={domicilio.id ?? ""}>
                      {getDomicilioLabel(domicilio)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {createForm.medioEntrega === "RETIRA_SUCURSAL" ? (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#2f3042]">Sucursal de retiro</span>
                {selectedCreateSucursal ? (
                  <div className="flex items-center justify-between rounded-2xl border border-[#d9caef] bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#2f3042]">{selectedCreateSucursal.nombre}</p>
                      <p className="text-xs text-[#6f7085]">{selectedCreateSucursal.direccion}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCreateSucursal(null);
                        handleCreateFieldChange("sucursalEntregaId", "");
                        setCreateSucursalQuery("");
                      }}
                      className="text-xs font-semibold text-[#6c48b4] hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      className="w-full rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                      value={createSucursalQuery}
                      onChange={(event) => setCreateSucursalQuery(event.target.value)}
                      onFocus={() => setShowCreateSucursalDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCreateSucursalDropdown(false), 150)}
                      placeholder={isLoadingSucursales ? "Cargando sucursales..." : "Escribí para filtrar sucursales..."}
                      autoComplete="off"
                      disabled={isLoadingSucursales}
                    />
                    {showCreateSucursalDropdown && filteredCreateSucursales.length > 0 ? (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-[#ddd6eb] bg-white shadow-lg">
                        <div className="max-h-56 overflow-y-auto">
                          {filteredCreateSucursales.map((sucursal) => (
                            <button
                              key={sucursal.id}
                              type="button"
                              onClick={() => {
                                setSelectedCreateSucursal(sucursal);
                                handleCreateFieldChange("sucursalEntregaId", String(sucursal.id));
                                setCreateSucursalQuery("");
                                setShowCreateSucursalDropdown(false);
                              }}
                              className="w-full px-4 py-3 text-left transition hover:bg-[#f6f2ff]"
                            >
                              <p className="font-semibold text-[#2f3042]">{sucursal.nombre}</p>
                              <p className="text-xs text-[#6f7085]">{sucursal.direccion}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : showCreateSucursalDropdown && !isLoadingSucursales && createSucursalQuery.trim().length > 0 ? (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-2xl border border-[#ddd6eb] bg-white shadow-lg">
                        <p className="px-4 py-3 text-sm text-[#5f6074]">No encontramos sucursales para esa búsqueda.</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </label>
            ) : null}

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#2f3042]">Forma de pago</span>
              <select
                className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                value={createForm.medioPago}
                onChange={(event) => handleCreateFieldChange("medioPago", event.target.value)}
              >
                {PAYMENT_OPTIONS.map((option) => (
                  <option key={option.value || "empty"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#2f3042]">Inicio del ciclo</span>
              <input
                type="date"
                className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                value={createForm.fechaInicioCicloBase}
                onChange={(event) => handleCreateFieldChange("fechaInicioCicloBase", event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#2f3042]">Fecha objetivo de entrega</span>
              <input
                type="date"
                className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                value={createForm.fechaObjetivoEntrega}
                onChange={(event) => handleCreateFieldChange("fechaObjetivoEntrega", event.target.value)}
              />
            </label>

            <div className="rounded-2xl border border-dashed border-[#ddd6eb] bg-[#faf8fd] p-4 text-sm text-[#5f6074] md:col-span-2">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 md:flex-row">
                  <input
                    className="flex-1 rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                    placeholder="Buscá productos para sumar al expediente"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void handleSearchProducts();
                    }}
                    className="rounded-2xl border border-[#d8ccef] px-4 py-3 text-sm font-semibold text-[#6c48b4] transition hover:bg-[#f7f2ff]"
                  >
                    {isSearchingProducts ? "Buscando..." : "Buscar productos"}
                  </button>
                </div>

                {selectedProducts.length > 0 ? (
                  <div className="grid gap-3">
                    {selectedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex flex-col gap-3 rounded-2xl border border-[#e2daf3] bg-white p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-[#2f3042]">{product.nombre}</p>
                          <p className="text-xs text-[#6f7085]">{product.laboratorio}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[#2f3042]">Cada</span>
                            <input
                              type="number"
                              min="1"
                              value={product.periodoDias}
                              onChange={(event) =>
                                handleProductPeriodChange(product.id, event.target.value)
                              }
                              className="w-20 rounded-xl border border-[#ddd6eb] px-3 py-2 text-sm outline-none transition focus:border-[#8f63d9]"
                            />
                            <span className="text-xs font-medium text-[#2f3042]">días</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(product.id)}
                            className="rounded-xl border border-[#f0dde2] px-3 py-2 text-xs font-semibold text-[#b03c55] transition hover:bg-[#fff4f6]"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#5f6074]">
                    Todavía no agregaste productos al expediente.
                  </p>
                )}

                {hasSearchedProducts ? (
                  productResults.length > 0 ? (
                    <div className="grid gap-3">
                      {productResults.map((product) => {
                        const alreadySelected = selectedProducts.some(
                          (item) => item.id === product.id,
                        );

                        return (
                          <div
                            key={product.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-[#e9e1f6] bg-white p-4"
                          >
                            <div>
                              <p className="font-semibold text-[#2f3042]">{product.nombre}</p>
                              <p className="text-xs text-[#6f7085]">
                                {product.laboratorio}
                                {product.presentacion ? ` · ${product.presentacion}` : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={alreadySelected}
                              onClick={() => handleAddProduct(product)}
                              className="rounded-xl bg-[#8f63d9] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#7f56c7] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {alreadySelected ? "Agregado" : "Agregar"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-[#5f6074]">
                      No encontramos productos para esa búsqueda.
                    </p>
                  )
                ) : null}
              </div>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isCreating || !hasVerifiedContact}
                className="inline-flex items-center justify-center rounded-2xl bg-[#8f63d9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f56c7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Creando expediente..." : "Crear expediente"}
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-3xl border border-[#ebe6f4] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-[#eef6ff] p-3 text-[#1f5ea8]">
                <FilePenLine size={20} />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-[#2f3042]">
                  {editingItem?.titulo
                    ? `Editando: ${editingItem.titulo}`
                    : "Editar expediente"}
                </h3>
                <p className="text-sm text-[#5f6074]">
                  {editingItem
                    ? "Modificá los datos y guardá los cambios."
                    : "Seleccioná un expediente de la lista para editarlo."}
                </p>
              </div>
            </div>
            {editingItem && hasEditChanges ? (
              <button
                type="button"
                onClick={() => {
                  if (editFormOriginal) {
                    setEditForm(editFormOriginal);
                    const sucursal = allSucursales.find(
                      (s) => String(s.id) === editFormOriginal.sucursalEntregaId,
                    ) ?? null;
                    setSelectedEditSucursal(sucursal);
                    setEditSucursalQuery("");
                  }
                }}
                className="flex items-center gap-1.5 rounded-2xl border border-[#ddd6eb] px-3 py-2 text-sm text-[#5f6074] transition hover:border-[#c4b5e0] hover:text-[#2f3042]"
                title="Descartar cambios"
              >
                <RotateCcw size={14} />
                Restaurar
              </button>
            ) : null}
          </div>

          {!editingItem && isLoadingExpedienteActual ? (
            <p className="text-sm text-[#5f6074]">Cargando expediente...</p>
          ) : null}

          {!editingItem && !isLoadingExpedienteActual && (expedienteActualError || expedienteActualNotFound || !expediente) ? (
            <div className="rounded-2xl border border-[#f0dde2] bg-[#fff7f8] px-4 py-3 text-sm text-[#7f1d2d]">
              {expedienteActualError || "No encontramos un expediente disponible para editar."}
            </div>
          ) : null}

          {canShowEditForm ? (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdateCurrent}>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#2f3042]">Título del expediente</span>
                <input
                  className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                  value={editForm.titulo}
                  onChange={(event) => handleEditFieldChange("titulo", event.target.value)}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#2f3042]">Contacto verificado</span>
                <select
                  className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                  value={editForm.contactoId}
                  onChange={(event) => handleEditFieldChange("contactoId", event.target.value)}
                >
                  <option value="">Seleccioná un contacto</option>
                  {verifiedContacts.map((contacto) => (
                    <option key={contacto.id} value={contacto.id}>
                      {getContactoLabel(contacto)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#2f3042]">Afiliación</span>
                <select
                  className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                  value={editForm.afiliacionOSId}
                  onChange={(event) => handleEditFieldChange("afiliacionOSId", event.target.value)}
                >
                  <option value="">Sin afiliación</option>
                  {afiliaciones.map((afiliacion, index) => {
                    const optionValue =
                      afiliacion.obraSocialId ??
                      `${afiliacion.planId ?? "plan"}-${index}`;

                    return (
                      <option key={optionValue} value={afiliacion.obraSocialId ?? ""}>
                        {getAfiliacionLabel(afiliacion)}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#2f3042]">Forma de entrega</span>
                <select
                  className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                  value={editForm.medioEntrega}
                  onChange={(event) => handleEditFieldChange("medioEntrega", event.target.value)}
                >
                  {DELIVERY_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {editForm.medioEntrega === "ENVIO_DOMICILIO" ? (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[#2f3042]">Domicilio de entrega</span>
                  <select
                    className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                    value={editForm.domicilioEntregaId}
                    onChange={(event) =>
                      handleEditFieldChange("domicilioEntregaId", event.target.value)
                    }
                  >
                    <option value="">SeleccionÃ¡ un domicilio</option>
                    {domicilios.map((domicilio) => (
                      <option key={getDomicilioValue(domicilio)} value={domicilio.id ?? ""}>
                        {getDomicilioLabel(domicilio)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {editForm.medioEntrega === "RETIRA_SUCURSAL" ? (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[#2f3042]">Sucursal de retiro</span>
                  {selectedEditSucursal ? (
                    <div className="flex items-center justify-between rounded-2xl border border-[#d9caef] bg-white px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[#2f3042]">{selectedEditSucursal.nombre}</p>
                        <p className="text-xs text-[#6f7085]">{selectedEditSucursal.direccion}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEditSucursal(null);
                          handleEditFieldChange("sucursalEntregaId", "");
                          setEditSucursalQuery("");
                          setShowEditSucursalDropdown(false);
                        }}
                        className="text-xs font-semibold text-[#6c48b4] hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        className="w-full rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                        value={editSucursalQuery}
                        onChange={(event) => setEditSucursalQuery(event.target.value)}
                        onFocus={() => setShowEditSucursalDropdown(true)}
                        onBlur={() => setTimeout(() => setShowEditSucursalDropdown(false), 150)}
                        placeholder={isLoadingSucursales ? "Cargando sucursales..." : "Escribí para filtrar sucursales..."}
                        autoComplete="off"
                        disabled={isLoadingSucursales}
                      />
                      {showEditSucursalDropdown && filteredEditSucursales.length > 0 ? (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-[#ddd6eb] bg-white shadow-lg">
                          <div className="max-h-56 overflow-y-auto">
                            {filteredEditSucursales.map((sucursal) => (
                              <button
                                key={sucursal.id}
                                type="button"
                                onClick={() => {
                                  setSelectedEditSucursal(sucursal);
                                  handleEditFieldChange("sucursalEntregaId", String(sucursal.id));
                                  setEditSucursalQuery("");
                                  setShowEditSucursalDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left transition hover:bg-[#f6f2ff]"
                              >
                                <p className="font-semibold text-[#2f3042]">{sucursal.nombre}</p>
                                <p className="text-xs text-[#6f7085]">{sucursal.direccion}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : showEditSucursalDropdown && !isLoadingSucursales && editSucursalQuery.trim().length > 0 ? (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-2xl border border-[#ddd6eb] bg-white shadow-lg">
                          <p className="px-4 py-3 text-sm text-[#5f6074]">No encontramos sucursales para esa búsqueda.</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </label>
              ) : null}

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#2f3042]">Forma de pago</span>
                <select
                  className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                  value={editForm.medioPago}
                  onChange={(event) => handleEditFieldChange("medioPago", event.target.value)}
                >
                  {PAYMENT_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#2f3042]">Inicio del ciclo</span>
                <input
                  type="date"
                  className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                  value={editForm.fechaInicioCicloBase}
                  readOnly
                  disabled
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#2f3042]">Fecha objetivo de entrega</span>
                <input
                  type="date"
                  className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                  value={editForm.fechaObjetivoEntrega}
                  onChange={(event) => handleEditFieldChange("fechaObjetivoEntrega", event.target.value)}
                />
              </label>

              <div className="rounded-2xl border border-dashed border-[#ddd6eb] bg-[#faf8fd] px-4 py-3 text-sm text-[#5f6074] md:col-span-2">
                Los cambios se reflejan en el portal una vez confirmados. Si tenés dudas sobre algún dato, consultá con tu asesor.
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isUpdatingCurrent || !hasVerifiedContact || !hasEditChanges}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#1f5ea8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#184a84] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingCurrent ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          ) : null}
        </article>
      </div>

      <article className="rounded-3xl border border-[#ebe6f4] bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-[#2f3042]">Tus expedientes</h3>
          <p className="text-sm text-[#5f6074]">
            Resumen de los expedientes detectados para el cliente autenticado.
          </p>
        </div>

        {expedientes.length === 0 ? (
          <p className="text-sm text-[#5f6074]">
            Todavía no hay expedientes para mostrar.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {expedientes.map((expedienteItem) => {
              const isActive = expedienteItem.expedienteId === activeExpedienteId;
              const isSelectedForEdit = expedienteItem.expedienteId === editExpedienteId;

              return (
                <button
                  key={expedienteItem.expedienteId}
                  type="button"
                  onClick={() => handleSelectExpedienteForEdit(expedienteItem)}
                  className={`w-full rounded-2xl border px-4 py-4 shadow-sm transition text-left ${
                    isSelectedForEdit
                      ? "border-[#1f5ea8] bg-[#eef6ff] ring-1 ring-[#1f5ea8]"
                      : isActive
                        ? "border-[#8f63d9] bg-[#faf7ff] hover:border-[#7f56c7]"
                        : "border-[#ebe6f4] bg-white hover:border-[#c5b8e8]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#2f3042]">
                        {expedienteItem.titulo ?? formatExpedienteLabel(expedienteItem.expedienteId)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8f63d9]">
                        {expedienteItem.estado}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {isActive ? (
                        <span className="rounded-full bg-[#8f63d9] px-2.5 py-1 text-xs font-semibold text-white">
                          Activo
                        </span>
                      ) : null}
                      {isSelectedForEdit ? (
                        <span className="rounded-full bg-[#1f5ea8] px-2.5 py-1 text-xs font-semibold text-white">
                          Editando
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <dl className="mt-4 space-y-2 text-sm text-[#5f6074]">
                    <div className="flex items-center justify-between gap-3">
                      <dt>Inicio</dt>
                      <dd className="text-right text-[#2f3042]">
                        {formatPortalProfileDate(expedienteItem.openedAt ?? null)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Objetivo actual</dt>
                      <dd className="text-right text-[#2f3042]">
                        {formatPortalProfileDate(expedienteItem.cicloActual?.fechaEntregaObjetivo ?? null)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Próxima acción</dt>
                      <dd className="text-right text-[#2f3042]">
                        {formatPortalProfileDate(expedienteItem.nextActionAt ?? null)}
                      </dd>
                    </div>
                  </dl>
                </button>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}
