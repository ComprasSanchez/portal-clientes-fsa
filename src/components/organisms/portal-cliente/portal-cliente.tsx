"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader } from "@/components/atoms/loader/loader";
import Header from "@/components/molecules/header/header";
import CartView, { CartViewItem } from "@/components/molecules/cart-view/cart-view";
import OrderProcessingLoader from "@/components/molecules/order-processing-loader/order-processing-loader";
import PedidosStep1 from "@/components/molecules/pedidos-steps/pedidos-step-1/pedidos-step-1";
import PedidosStep2 from "@/components/molecules/pedidos-steps/pedidos-step-2/pedidos-step-2";
import PedidosStep3 from "@/components/molecules/pedidos-steps/pedidos-step-3/pedidos-step-3";
import type { ConfirmDeliveryData } from "@/components/molecules/confirm-delivery/confirm-delivery";
import type { ConfirmProductItem } from "@/components/molecules/confirm-accordion/confirm-accordion";
import type { PedidoItem } from "@/components/molecules/pedido-accordion.tsx/pedido-accordion";
import type {
  DecodedToken,
  Domicilio,
  ItemRecurrente,
  ItemRecurrenteDetalle,
  OccasionalAddress,
  Product,
  Sucursal,
} from "@/types/magic-link-type";
import { SUCURSALES_OCULTAS } from "@/lib/use-portal-sucursales";
import styles from "./portal-cliente.module.scss";

type PortalClienteProps = {
  token: string;
  onOpenSidebar?: () => void;
};

type DeliverySelection = {
  method: "domicilio" | "sucursal";
  domicilioId?: string;
  sucursalId?: number;
  occasionalAddress?: OccasionalAddress;
  occasionalAddressSaved?: boolean;
};

type ApiProductsResponse = {
  data?: unknown[] | Record<string, unknown>;
  meta?: {
    total?: number;
  };
};

type PagoPreferenciaResponse = {
  initPoint?: string;
  pagoId?: string;
};

type ParentOrderDraftResponse = {
  parentOrderId?: string;
  code?: string;
  created?: boolean;
};

type ConfirmOrderChoice = "pagar_ahora" | "contactenme";

type PaymentStatus = "idle" | "redirecting" | "processing" | "rejected" | "pending";

type FriendlyPortalError = {
  title: string;
  message: string;
};

type PortalProductItem = {
  id: string;
  nombre: string;
  laboratorio: string;
  cantidad: number;
  checked: boolean;
  recurring: boolean;
  precio: number | null;
  precioBase: number | null;
  descuentoPct: number;
};

const PAGE_SIZE = 4;
const SEARCH_AUTOCOMPLETE_MIN_CHARS = 3;
const SEARCH_AUTOCOMPLETE_DEBOUNCE_MS = 400;
const CONFIRM_STATES = new Set([
  "ACCEPTED",
  "CONFIRMED",
  "IN_PREPARATION",
  "PREPARED_PARTIAL",
  "PREPARED",
]);

const decodeJwt = (token: string): DecodedToken | null => {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

    return JSON.parse(window.atob(padded)) as DecodedToken;
  } catch {
    return null;
  }
};

const toProduct = (value: Record<string, unknown>): Product => ({
  id: String(value.id ?? value.productoIdOrSkuExt ?? ""),
  nombre: String(value.nombre ?? value.productoNombre ?? "Producto sin nombre"),
  lab: String(value.lab ?? value.marcaNombre ?? "Laboratorio sin dato"),
  presentacion:
    typeof value.presentacion === "string" ? value.presentacion : undefined,
  precio: typeof value.precio === "number" ? value.precio : null,
  precioBase: typeof value.precioBase === "number" ? value.precioBase : null,
  descuentoPct: typeof value.descuentoPct === "number" ? value.descuentoPct : 0,
});

const toJson = async <T,>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "La solicitud falló");
  }

  return (await response.json()) as T;
};

const mapRecurringItems = (expediente: ItemRecurrente): PortalProductItem[] =>
  expediente.cicloItems
    .filter((item: ItemRecurrenteDetalle) => Boolean(item.activo))
    .map((item) => ({
      id: item.id,
      nombre: item.productoNombre || "Producto sin nombre",
      laboratorio: item.marcaNombre || "Laboratorio sin dato",
      cantidad:
        typeof item.plannedUnits === "number" && item.plannedUnits > 0
          ? item.plannedUnits
          : 1,
      checked: String(item.status || "").toUpperCase() !== "SKIPPED",
      recurring: true,
      precio: typeof item.precio === "number" ? item.precio : null,
      precioBase: typeof item.precioBase === "number" ? item.precioBase : null,
      descuentoPct: typeof item.descuentoPct === "number" ? item.descuentoPct : 0,
    }));

const extractErrorDetails = (rawError: string): string[] => {
  try {
    const parsed = JSON.parse(rawError) as { message?: string | string[] };

    if (Array.isArray(parsed.message)) {
      return parsed.message;
    }

    if (typeof parsed.message === "string") {
      return [parsed.message];
    }
  } catch {
    // Si no es JSON, usamos el texto original más abajo.
  }

  return [rawError];
};

const getFriendlyPortalError = (
  rawError: string | null,
  context: "load" | "confirm",
): FriendlyPortalError | null => {
  if (!rawError) {
    return null;
  }

  const details = extractErrorDetails(rawError).join(" ").toLowerCase();

  if (details.includes("expirado") || details.includes("expired")) {
    return {
      title: "Este enlace ya venció",
      message:
        "Estos enlaces tienen un tiempo límite por seguridad.\nSi ya confirmaste tu pedido, quedate tranquilo 😊 Está todo bien y no tenés que hacer nada más.\nSi todavía te falta completar algo, escribinos y seguimos juntos 💜",
    };
  }

  if (details.includes("sucursalentregaid")) {
    return {
      title: "No pudimos confirmar la sucursal",
      message:
        "La sucursal elegida no pudo validarse correctamente. Volvé a seleccionarla e intentá nuevamente.",
    };
  }

  if (details.includes("domicilio")) {
    return {
      title:
        context === "confirm" ? "No pudimos confirmar la entrega" : "No pudimos cargar tus direcciones",
      message:
        context === "confirm"
          ? "Hubo un problema al validar el domicilio elegido. Revisalo e intentá nuevamente."
          : "Hubo un problema al recuperar tus domicilios. Probá nuevamente en unos minutos.",
    };
  }

  if (details.includes("token")) {
    return {
      title: "El enlace ya no es válido",
      message:
        "No pudimos validar los datos de acceso del portal. Pedile a CORA un nuevo enlace para continuar.",
    };
  }

  if (details.includes("sin stock suficiente")) {
    const rawMessage = extractErrorDetails(rawError).join(" ");
    const match = rawMessage.match(/sin stock suficiente para:\s*(.+)/i);
    const productos = match?.[1]?.trim();

    return {
      title: "Sin stock disponible",
      message: productos
        ? `Por ahora no tenemos stock suficiente de: ${productos}. Ajustá las cantidades o quitá esos productos para poder continuar.`
        : "Por ahora no tenemos stock suficiente para completar tu pedido. Ajustá las cantidades o quitá algún producto para poder continuar.",
    };
  }

  if (context === "confirm") {
    return {
      title: "No pudimos confirmar tu pedido",
      message:
        "Se produjo un problema al registrar la solicitud. Intentá nuevamente y, si continúa, hablá con CORA.",
    };
  }

  return {
    title: "No pudimos abrir el portal",
    message:
      "Ocurrió un problema al cargar tu información. Probá nuevamente dentro de unos instantes.",
  };
};

export default function PortalCliente({
  token,
  onOpenSidebar,
}: PortalClienteProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Al pasar de paso (adelante o atrás), volver arriba — si no, la nueva
  // vista arranca en el scroll donde había quedado la anterior.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [step]);

  const [productosSubpaso, setProductosSubpaso] = useState<
    "revisar" | "agregar"
  >("revisar");
  const [openCart, setOpenCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recurrentItems, setRecurrentItems] = useState<PortalProductItem[]>([]);
  const [addedProducts, setAddedProducts] = useState<PortalProductItem[]>([]);
  const [originalProductIds, setOriginalProductIds] = useState<string[]>([]);
  const [originalRecurringQuantities, setOriginalRecurringQuantities] =
    useState<Record<string, number>>({});
  // Ids de items recurrentes ya marcados SKIPPED en el backend en este
  // intento de confirmación — evita reenviar el PATCH (y duplicar el
  // historial del ciclo) si handleConfirmOrder se reintenta tras una falla
  // más adelante en el flujo (ver originalProductIds, mismo problema).
  const [syncedSkippedItemIds, setSyncedSkippedItemIds] = useState<string[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const searchRequestIdRef = useRef(0);
  const [domicilios, setDomicilios] = useState<Domicilio[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [expediente, setExpediente] = useState<ItemRecurrente | null>(null);
  const [tokenData, setTokenData] = useState<DecodedToken | null>(null);
  const [deliverySelection, setDeliverySelection] = useState<DeliverySelection>({
    method: "domicilio",
  });
  const [selectedOccasionalAddress, setSelectedOccasionalAddress] =
    useState<OccasionalAddress | null>(null);
  const [isOccasionalAddressSaved, setIsOccasionalAddressSaved] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");

  const router = useRouter();
  const searchParams = useSearchParams();

  const orderConfirmedStorageKey = `portal-order-confirmed:${token}`;
  const orderCodeStorageKey = `portal-order-code:${token}`;
  const linkAbiertoSentRef = useRef(false);
  const pagoStatusHandledRef = useRef(false);

  const cartItems = useMemo<CartViewItem[]>(
    () =>
      [...recurrentItems.filter((item) => item.checked), ...addedProducts].map((item) => ({
        id: item.id,
        nombre: item.nombre,
        laboratorio: item.laboratorio,
        cantidad: item.cantidad,
        precio: item.precio,
        precioBase: item.precioBase,
        descuentoPct: item.descuentoPct,
      })),
    [addedProducts, recurrentItems],
  );

  const pedidoItems = useMemo<PedidoItem[]>(
    () =>
      [...recurrentItems, ...addedProducts].map((item) => ({
        id: item.id,
        nombre: item.nombre,
        laboratorio: item.laboratorio,
        cantidad: item.cantidad,
        checked: item.checked,
        precio: item.precio,
        precioBase: item.precioBase,
        descuentoPct: item.descuentoPct,
      })),
    [addedProducts, recurrentItems],
  );

  const productosConfirmacion = useMemo<ConfirmProductItem[]>(
    () =>
      [...recurrentItems.filter((item) => item.checked), ...addedProducts].map(
        (item) => ({
          id: item.id,
          nombre: item.nombre,
          laboratorio: item.laboratorio,
          cantidad: item.cantidad ?? 1,
          precio: item.precio,
          precioBase: item.precioBase,
          descuentoPct: item.descuentoPct,
          recurring: item.recurring,
        }),
      ),
    [addedProducts, recurrentItems],
  );

  const entregaConfirmacion = useMemo<ConfirmDeliveryData | null>(() => {
    if (deliverySelection.method === "domicilio") {
      if (deliverySelection.occasionalAddress) {
        return {
          tipo: "domicilio",
          direccion: `${deliverySelection.occasionalAddress.calle} ${deliverySelection.occasionalAddress.numero}`,
          detalle: `${deliverySelection.occasionalAddress.ciudad}, ${deliverySelection.occasionalAddress.provincia}`,
        };
      }

      const domicilio = domicilios.find((item) => item.id === deliverySelection.domicilioId);
      if (!domicilio) {
        return null;
      }

      const direccion = [
        domicilio.calle,
        domicilio.numero,
        domicilio.piso ? `Piso ${domicilio.piso}` : "",
        domicilio.depto ? `Dpto ${domicilio.depto}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      return {
        tipo: "domicilio",
        direccion: direccion || domicilio.etiqueta,
        detalle: [domicilio.ciudad, domicilio.provincia].filter(Boolean).join(", "),
      };
    }

    const sucursal = sucursales.find(
      (item) => String(item.id) === String(deliverySelection.sucursalId),
    );

    if (!sucursal) {
      return null;
    }

    return {
      tipo: "sucursal",
      direccion: sucursal.nombre,
      detalle: sucursal.direccion,
    };
  }, [deliverySelection, domicilios, sucursales]);

  const loadErrorContent = useMemo(
    () => getFriendlyPortalError(error, "load"),
    [error],
  );
  const confirmErrorContent = useMemo(
    () => getFriendlyPortalError(error, "confirm"),
    [error],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const decoded = decodeJwt(token);
    setTokenData(decoded);

    if (decoded && !linkAbiertoSentRef.current) {
      linkAbiertoSentRef.current = true;
      fetch(`/api/magic/portal-clientes/${token}/movimientos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tipo: "LINK_ABIERTO" }),
      }).catch(() => {
        // Ignorado: no debe bloquear la carga del portal.
      });
    }

    if (window.localStorage.getItem(orderConfirmedStorageKey) === "true") {
      setOrderConfirmed(true);
      setOrderNumber(window.localStorage.getItem(orderCodeStorageKey));
      setStep(3);
    }
  }, [orderCodeStorageKey, orderConfirmedStorageKey, token]);

  // Al volver de Mercado Pago, el link trae ?pagoStatus=approved|rejected|pending.
  // Lo leemos una sola vez y lo sacamos de la URL para no dejarlo pegado ahí.
  useEffect(() => {
    if (pagoStatusHandledRef.current) {
      return;
    }

    const pagoStatus = searchParams.get("pagoStatus");
    if (!pagoStatus) {
      return;
    }

    pagoStatusHandledRef.current = true;
    setStep(3);

    if (pagoStatus === "approved") {
      setPaymentStatus("processing");
    } else if (pagoStatus === "rejected") {
      setPaymentStatus("rejected");
    } else if (pagoStatus === "pending") {
      setPaymentStatus("pending");
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("pagoStatus");
    const query = nextParams.toString();
    router.replace(`/portal-cliente/${token}${query ? `?${query}` : ""}`);
  }, [router, searchParams, token]);

  // Al volver con pagoStatus=approved, el webhook de Mercado Pago puede
  // tardar unos segundos más que el propio redirect del navegador — se
  // reintenta un puñado de veces antes de confiar igual en el resultado que
  // ya nos dio Mercado Pago, para no dejar al cliente esperando sin fin.
  useEffect(() => {
    if (paymentStatus !== "processing" || !tokenData?.cicloId) {
      return;
    }

    let cancelled = false;
    let attempt = 0;
    const MAX_ATTEMPTS = 5;
    const RETRY_DELAY_MS = 2500;

    const confirmarComoAprobado = (code?: string | null) => {
      if (cancelled) return;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(orderConfirmedStorageKey, "true");
        if (code) {
          window.localStorage.setItem(orderCodeStorageKey, code);
        }
      }
      // Pago confirmado: en vez de quedarse en el link público, lo mandamos
      // directo a la vista de pedidos del portal autenticado.
      router.push("/cora?view=pedidos");
    };

    const poll = async () => {
      attempt += 1;
      try {
        const response = await fetch(
          `/api/magic/portal-clientes/${token}/order-cycles/${tokenData.cicloId}/parent-orders`,
        );

        if (response.ok) {
          const parentOrders = (await response.json()) as Array<{
            status?: string;
            code?: string;
          }>;
          const currentOrder = parentOrders[0];

          if (currentOrder?.status && CONFIRM_STATES.has(currentOrder.status)) {
            confirmarComoAprobado(currentOrder.code);
            return;
          }
        }
      } catch {
        // Reintenta igual, ver comentario arriba.
      }

      if (cancelled) return;

      if (attempt < MAX_ATTEMPTS) {
        window.setTimeout(() => {
          void poll();
        }, RETRY_DELAY_MS);
      } else {
        confirmarComoAprobado(null);
      }
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, [orderCodeStorageKey, orderConfirmedStorageKey, paymentStatus, router, token, tokenData]);

  useEffect(() => {
    let cancelled = false;

    const loadPortal = async () => {
      try {
        setLoading(true);
        setError(null);

        const [expedienteResponse, domiciliosResponse, sucursalesResponse] =
          await Promise.all([
            fetch(`/api/magic/portal-clientes/${token}/items-recurrentes`),
            fetch(`/api/magic/portal-clientes/${token}/domicilios`),
            fetch(`/api/magic/portal-clientes/${token}/sucursales/search?limit=50`),
          ]);

        const expedienteData = await toJson<ItemRecurrente>(expedienteResponse);
        const domiciliosData = await toJson<{ domicilios?: Domicilio[] }>(domiciliosResponse);
        const sucursalesData = await toJson<Sucursal[] | { sucursales?: Sucursal[] }>(
          sucursalesResponse,
        );

        if (cancelled) {
          return;
        }

        const recurring = mapRecurringItems(expedienteData);
        const domiciliosList = Array.isArray(domiciliosData.domicilios)
          ? domiciliosData.domicilios
          : [];

        setExpediente(expedienteData);
        setRecurrentItems(recurring);
        setOriginalProductIds(recurring.map((item) => item.id));
        setOriginalRecurringQuantities(
          Object.fromEntries(recurring.map((item) => [item.id, item.cantidad])),
        );
        setDomicilios(domiciliosList);
        const sucursalesList = Array.isArray(sucursalesData)
          ? sucursalesData
          : Array.isArray(sucursalesData.sucursales)
            ? sucursalesData.sucursales
            : [];
        setSucursales(
          sucursalesList.filter((s) => !SUCURSALES_OCULTAS.has(Number(s.id))),
        );

        const principal = domiciliosList.find((item) => item.principal) ?? domiciliosList[0];
        if (principal) {
          setDeliverySelection((current) => ({
            ...current,
            method: "domicilio",
            domicilioId: current.domicilioId ?? principal.id,
          }));
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No se pudo cargar el portal",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPortal();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!tokenData?.cicloId || orderConfirmed) {
      return;
    }

    let cancelled = false;

    const checkParentOrderStatus = async () => {
      try {
        const response = await fetch(
          `/api/magic/portal-clientes/${token}/order-cycles/${tokenData.cicloId}/parent-orders`,
        );

        if (!response.ok) {
          return;
        }

        const parentOrders = (await response.json()) as Array<{
          status?: string;
          code?: string;
        }>;
        const currentOrder = parentOrders[0];

        if (
          !cancelled &&
          currentOrder?.status &&
          CONFIRM_STATES.has(currentOrder.status)
        ) {
          setOrderConfirmed(true);
          setOrderNumber(currentOrder.code ?? null);
          setStep(3);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(orderConfirmedStorageKey, "true");
            if (currentOrder.code) {
              window.localStorage.setItem(orderCodeStorageKey, currentOrder.code);
            }
          }
        }
      } catch {
        // Ignorado para no bloquear el flujo principal.
      }
    };

    void checkParentOrderStatus();

    return () => {
      cancelled = true;
    };
  }, [orderCodeStorageKey, orderConfirmed, orderConfirmedStorageKey, token, tokenData]);

  const handleSearch = async (page: number = 1) => {
    if (!searchQuery.trim()) {
      searchRequestIdRef.current += 1;
      setHasSearched(true);
      setSearchResults([]);
      setTotalResults(0);
      return;
    }

    searchRequestIdRef.current += 1;
    const requestId = searchRequestIdRef.current;

    try {
      setHasSearched(true);
      setSearchLoading(true);

      const params = new URLSearchParams({
        busqueda: searchQuery.trim(),
        paginanro: String(page),
        paginacant: String(PAGE_SIZE),
      });

      const response = await fetch(
        `/api/magic/portal-clientes/${token}/productos?${params.toString()}`,
      );
      const data = await toJson<ApiProductsResponse>(response);

      // Puede haber una búsqueda más nueva en vuelo (autocompletado) que ya
      // arrancó después de esta — si es así, descartamos esta respuesta vieja
      // en vez de pisar resultados más frescos.
      if (searchRequestIdRef.current !== requestId) return;

      const list = Array.isArray(data.data)
        ? data.data
        : data.data
          ? [data.data]
          : [];

      setSearchResults(
        list
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
          .map(toProduct),
      );
      setTotalResults(data.meta?.total ?? list.length);
      setCurrentPage(page);
    } catch {
      if (searchRequestIdRef.current !== requestId) return;
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      if (searchRequestIdRef.current === requestId) {
        setSearchLoading(false);
      }
    }
  };

  // Autocompletado: busca sola mientras el usuario tipea, con debounce y un
  // mínimo de caracteres para no disparar una request por cada tecla.
  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed.length === 0) {
      searchRequestIdRef.current += 1;
      setHasSearched(false);
      setSearchResults([]);
      setTotalResults(0);
      return;
    }

    if (trimmed.length < SEARCH_AUTOCOMPLETE_MIN_CHARS) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleSearch(1);
    }, SEARCH_AUTOCOMPLETE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      void handleSearch(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
    if (currentPage < totalPages) {
      void handleSearch(currentPage + 1);
    }
  };

  const handleToggleItem = (id: string, checked: boolean) => {
    const isRecurring = recurrentItems.some((item) => item.id === id);

    if (isRecurring) {
      setRecurrentItems((items) =>
        items.map((item) => (item.id === id ? { ...item, checked } : item)),
      );
      return;
    }

    if (!checked) {
      setAddedProducts((items) => items.filter((item) => item.id !== id));
    }
  };

  const handleToggleProduct = (product: Product) => {
    setAddedProducts((items) => {
      const exists = items.some((item) => item.id === product.id);

      if (exists) {
        return items.filter((item) => item.id !== product.id);
      }

      return [
        ...items,
        {
          id: product.id,
          nombre: product.nombre,
          laboratorio: product.lab,
          cantidad: 1,
          checked: true,
          recurring: false,
          precio: product.precio ?? null,
          precioBase: product.precioBase ?? null,
          descuentoPct: product.descuentoPct ?? 0,
        },
      ];
    });
  };

  const isProductSelected = (product: Product) =>
    addedProducts.some((item) => item.id === product.id);

  const getProductQuantity = (id: string) =>
    [...recurrentItems, ...addedProducts].find((item) => item.id === id)
      ?.cantidad ?? 1;

  const handleChangeProductQuantity = (id: string, delta: number) => {
    if (recurrentItems.some((item) => item.id === id)) {
      // Un item recurrente nunca se saca por cantidad — para eso está el
      // switch (lo desmarca en vez de desaparecer). El mínimo acá es 1.
      setRecurrentItems((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, cantidad: Math.max(1, item.cantidad + delta) }
            : item,
        ),
      );
      return;
    }

    setAddedProducts((items) => {
      const current = items.find((item) => item.id === id);
      if (!current) return items;

      const nextCantidad = current.cantidad + delta;
      if (nextCantidad < 1) {
        return items.filter((item) => item.id !== id);
      }

      return items.map((item) =>
        item.id === id ? { ...item, cantidad: nextCantidad } : item,
      );
    });
  };

  const handleRemoveFromCart = (id: string) => {
    if (recurrentItems.some((item) => item.id === id)) {
      setRecurrentItems((items) =>
        items.map((item) => (item.id === id ? { ...item, checked: false } : item)),
      );
      return;
    }

    setAddedProducts((items) => items.filter((item) => item.id !== id));
  };

  const handleContinueToDelivery = () => {
    if (cartItems.length > 0) {
      setStep(2);
    }
  };

  const handleSaveOccasionalAddress = async (address: OccasionalAddress) => {
    if (!tokenData?.cicloId) {
      throw new Error("No se encontró el ciclo asociado al token");
    }

    const response = await fetch(`/api/magic/portal-clientes/${token}/domicilio-occasional`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cicloId: tokenData.cicloId,
        ...address,
      }),
    });

    await toJson<Record<string, unknown>>(response);
    setSelectedOccasionalAddress(address);
    setIsOccasionalAddressSaved(true);
  };

  const handleConfirmSelection = (selection: DeliverySelection) => {
    setDeliverySelection(selection);
    if (selection.occasionalAddress) {
      setSelectedOccasionalAddress(selection.occasionalAddress);
      setIsOccasionalAddressSaved(Boolean(selection.occasionalAddressSaved));
    }
    setStep(3);
  };

  const redirectToWhatsApp = () => {
    if (typeof window === "undefined") return;
    const phone = process.env.NEXT_PUBLIC_FSA_PHONE_PORTAL;
    if (!phone) return;
    const message =
      "Hola, estoy armando mi pedido mensual y necesito ayuda para continuar.";
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const handleContactAdvisor = async () => {
    try {
      await fetch(`/api/magic/portal-clientes/${token}/movimientos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tipo: "DECISION_GUARDADA" }),
      });
    } catch {
      // Ignorado para no cortar el contacto con el asesor.
    }

    redirectToWhatsApp();
  };
  
  const handleConfirmOrder = async (choice: ConfirmOrderChoice) => {
    if (!tokenData?.cicloId || !tokenData.clienteId || !tokenData.expedienteId) {
      setError("El token no tiene la información necesaria para confirmar el pedido");
      return;
    }

    if (cartItems.length === 0) {
      setError("Seleccioná al menos un producto antes de confirmar");
      return;
    }

    setSubmittingOrder(true);
    setError(null);

    try {
      if (deliverySelection.method === "domicilio") {
        if (deliverySelection.occasionalAddress) {
          await fetch(`/api/magic/portal-clientes/${token}/domicilio-occasional`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cicloId: tokenData.cicloId,
              ...deliverySelection.occasionalAddress,
            }),
          }).then(toJson<Record<string, unknown>>);
        } else if (deliverySelection.domicilioId) {
          await fetch(`/api/magic/portal-clientes/${token}/domicilio`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              domicilioId: deliverySelection.domicilioId,
            }),
          }).then(toJson<Record<string, unknown>>);
        } else {
          throw new Error("Seleccioná un domicilio para continuar");
        }
      } else if (deliverySelection.sucursalId) {
        const sucursalEntregaId = deliverySelection.sucursalId;

        if (!Number.isInteger(sucursalEntregaId) || sucursalEntregaId < 1) {
          throw new Error("La sucursal seleccionada no es válida");
        }

        await fetch(`/api/magic/portal-clientes/${token}/sucursal-entrega`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sucursalEntregaId,
          }),
        }).then(toJson<Record<string, unknown>>);
      } else {
        throw new Error("Seleccioná una sucursal para continuar");
      }

      const skippedItemIds = recurrentItems
        .filter((item) => !item.checked)
        .map((item) => item.id)
        .filter((itemId) => !syncedSkippedItemIds.includes(itemId));

      await Promise.all(
        skippedItemIds.map((itemId) =>
          fetch(`/api/magic/portal-clientes/${token}/ciclos/${tokenData.cicloId}/items/${itemId}/skipped`, {
            method: "PATCH",
          }).then(toJson<Record<string, unknown>>),
        ),
      );

      if (skippedItemIds.length > 0) {
        // Idem newProducts: si un paso posterior falla y se reintenta todo
        // desde acá, no volver a marcar SKIPPED (duplicaría el historial).
        setSyncedSkippedItemIds((prev) => [...prev, ...skippedItemIds]);
      }

      const changedQuantityItems = recurrentItems.filter(
        (item) => item.cantidad !== (originalRecurringQuantities[item.id] ?? 1),
      );

      await Promise.all(
        changedQuantityItems.map((item) =>
          fetch(`/api/magic/portal-clientes/${token}/ciclos/${tokenData.cicloId}/items/${item.id}/cantidad`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ plannedUnits: item.cantidad }),
          }).then(toJson<Record<string, unknown>>),
        ),
      );

      if (changedQuantityItems.length > 0) {
        // Idem: no volver a mandar la misma cantidad en un reintento (cada
        // PATCH crea un evento nuevo en el historial del ciclo).
        setOriginalRecurringQuantities((prev) => {
          const next = { ...prev };
          for (const item of changedQuantityItems) {
            next[item.id] = item.cantidad;
          }
          return next;
        });
      }

      const newProducts = addedProducts.filter(
        (product) => !originalProductIds.includes(product.id),
      );

      await Promise.all(
        newProducts.map((product) =>
          fetch(`/api/magic/portal-clientes/${token}/items`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              expedienteId: tokenData.expedienteId,
              clienteId: tokenData.clienteId,
              productoIdOrSkuExt: product.id,
              productoNombre: product.nombre,
              marcaNombre: product.laboratorio,
              cadenciaDias: 30,
              periodoDias: 30,
              unidadesPorEnvase: 30,
              dosisPorToma: 1,
              tomasPorDia: 1,
              cantidadEnvasesPorCiclo: product.cantidad,
            }),
          }).then(toJson<Record<string, unknown>>),
        ),
      );

      if (newProducts.length > 0) {
        // Evita que un reintento tras una falla más adelante (ej. pago
        // rechazado por stock) vuelva a ver estos productos como "nuevos" y
        // los cree de nuevo — handleConfirmOrder no es idempotente, así que
        // cada sub-paso debe marcar su propio progreso ni bien se confirma.
        setOriginalProductIds((prev) => [
          ...prev,
          ...newProducts.map((product) => product.id),
        ]);
      }

      await fetch(`/api/magic/portal-clientes/${token}/movimientos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tipo: "DECISION_GUARDADA" }),
      }).then(toJson<Record<string, unknown>>);

      if (choice === "contactenme") {
        const draft = await fetch(
          `/api/magic/portal-clientes/${token}/parent-orders/draft`,
          { method: "POST" },
        ).then(toJson<ParentOrderDraftResponse>);

        setOrderConfirmed(true);
        setOrderNumber(draft.code ?? null);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(orderConfirmedStorageKey, "true");
          if (draft.code) {
            window.localStorage.setItem(orderCodeStorageKey, draft.code);
          }
        }
        redirectToWhatsApp();
        return;
      }

      // El ParentOrder ya no se crea acá directo: nace del lado del backend
      // (en PENDING_PAYMENT) recién cuando se arma la preferencia de pago,
      // y pasa a confirmado cuando Mercado Pago aprueba el pago (webhook).
      const pago = await fetch(`/api/magic/portal-clientes/${token}/pago/preferencia`, {
        method: "POST",
      }).then(toJson<PagoPreferenciaResponse>);

      if (!pago.initPoint) {
        throw new Error("No se pudo generar el link de pago");
      }

      setPaymentStatus("redirecting");
      window.location.assign(pago.initPoint);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo confirmar el pedido",
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Reintento inmediato tras un rechazo: el cliente sigue en el portal, así
  // que alcanza con una preferencia de pago nueva — no hace falta un link
  // nuevo por WhatsApp (eso es para cuando ya se fue, ver PortalTokenCheckJob).
  const handleRetryPayment = async () => {
    setPaymentStatus("redirecting");
    setError(null);

    try {
      const pago = await fetch(`/api/magic/portal-clientes/${token}/pago/preferencia`, {
        method: "POST",
      }).then(toJson<PagoPreferenciaResponse>);

      if (!pago.initPoint) {
        throw new Error("No se pudo generar el link de pago");
      }

      window.location.assign(pago.initPoint);
    } catch (requestError) {
      setPaymentStatus("rejected");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo reintentar el pago",
      );
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (submittingOrder || paymentStatus === "redirecting" || paymentStatus === "processing") {
    return <OrderProcessingLoader />;
  }

  const handleBackStep = () => {
    setStep((current) => {
      if (current === 2) {
        // Al volver de "Coordinamos tu entrega" a productos, reabrimos en
        // "agregar" (buscador) en vez de reiniciar en "revisar" — es de
        // donde el usuario probablemente estaba antes de avanzar.
        setProductosSubpaso("agregar");
        return 1;
      }
      if (current === 3) return 2;
      return current;
    });
  };

  const hasLoadFailed = Boolean(error) && !expediente;

  return (
    <div className={styles.root}>
      <Header
        showBackButton={step > 1 && !orderConfirmed}
        showCart={!hasLoadFailed}
        onBack={handleBackStep}
        onCartClick={() => setOpenCart(true)}
        cartCount={cartItems.length}
        onMenuClick={onOpenSidebar}
      />

      <CartView
        open={openCart}
        items={cartItems}
        onClose={() => setOpenCart(false)}
        onRemove={handleRemoveFromCart}
        onChat={() => {
          void handleContactAdvisor();
        }}
      />

      <main className={styles.content}>


        {!loading && hasLoadFailed && (
          <div className={`${styles.statusCard} ${styles.error}`}>
            <p className={styles.statusTitle}>{loadErrorContent?.title ?? "No pudimos abrir el portal"}</p>
            <p className={styles.statusText}>
              {loadErrorContent?.message ?? "Ocurrió un problema inesperado al cargar el portal."}
            </p>
            <button
              type="button"
              className={styles.statusAction}
              onClick={() => {
                void handleContactAdvisor();
              }}
            >
              Hablar con CORA
            </button>
          </div>
        )}

        {!loading && expediente && step === 1 && (
          <PedidosStep1
            items={pedidoItems}
            searchQuery={searchQuery}
            hasSearched={hasSearched}
            searchResults={searchResults}
            searchLoading={searchLoading}
            currentPage={currentPage}
            totalResults={totalResults}
            pageSize={PAGE_SIZE}
            onSearchChange={(value) => setSearchQuery(value)}
            onSearch={() => {
              void handleSearch(1);
            }}
            onToggleItem={handleToggleItem}
            onToggleProduct={handleToggleProduct}
            isProductSelected={isProductSelected}
            getProductQuantity={getProductQuantity}
            onChangeProductQuantity={handleChangeProductQuantity}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            onContinue={handleContinueToDelivery}
            onContactAdvisor={() => {
              void handleContactAdvisor();
            }}
            splitProductSteps={Boolean(onOpenSidebar)}
            subpaso={productosSubpaso}
            onSubpasoChange={setProductosSubpaso}
          />
        )}

        {!loading && expediente && step === 2 && (
          <PedidosStep2
            domicilios={domicilios}
            sucursales={sucursales}
            selectedMethod={deliverySelection.method}
            selectedDomicilioId={deliverySelection.domicilioId ?? null}
            selectedSucursalId={deliverySelection.sucursalId ?? null}
            selectedOccasionalAddress={selectedOccasionalAddress}
            isOccasionalAddressSaved={isOccasionalAddressSaved}
            onConfirmSelection={handleConfirmSelection}
            onSaveOccasionalAddress={handleSaveOccasionalAddress}
            onContactAdvisor={() => {
              void handleContactAdvisor();
            }}
            onBack={onOpenSidebar ? handleBackStep : undefined}
          />
        )}

        {!loading && expediente && step === 3 && (
          <>
            {error && (
              <div className={`${styles.statusCard} ${styles.error}`}>
                <p className={styles.statusTitle}>
                  {confirmErrorContent?.title ?? "Hay algo para revisar"}
                </p>
                <p className={styles.statusText}>
                  {confirmErrorContent?.message ?? "No pudimos completar esta acción."}
                </p>
              </div>
            )}

            <PedidosStep3
              productos={productosConfirmacion}
              entrega={entregaConfirmacion}
              isSubmitting={submittingOrder}
              orderConfirmed={orderConfirmed}
              orderNumber={orderNumber}
              paymentStatus={paymentStatus}
              token={token}
              cicloId={tokenData?.cicloId}
              onConfirm={(choice) => {
                void handleConfirmOrder(choice);
              }}
              onRetryPayment={() => {
                void handleRetryPayment();
              }}
              onContactAdvisor={() => {
                void handleContactAdvisor();
              }}
              onBack={onOpenSidebar && !orderConfirmed ? handleBackStep : undefined}
              onRemoveProduct={handleRemoveFromCart}
              onChangeProductQuantity={handleChangeProductQuantity}
            />
          </>
        )}
      </main>
    </div>
  );
}