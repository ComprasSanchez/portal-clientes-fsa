"use client";

import { useEffect, useMemo, useState } from "react";
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
import styles from "./portal-cliente.module.scss";

type PortalClienteProps = {
  token: string;
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

type DraftOrderResponse = {
  id?: string;
  code?: string;
};

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
};

const PAGE_SIZE = 4;
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
      cantidad: 1,
      checked: String(item.status || "").toUpperCase() !== "SKIPPED",
      recurring: true,
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

export default function PortalCliente({ token }: PortalClienteProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [openCart, setOpenCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recurrentItems, setRecurrentItems] = useState<PortalProductItem[]>([]);
  const [addedProducts, setAddedProducts] = useState<PortalProductItem[]>([]);
  const [originalProductIds, setOriginalProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
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

  const orderConfirmedStorageKey = `portal-order-confirmed:${token}`;
  const orderCodeStorageKey = `portal-order-code:${token}`;

  const cartItems = useMemo<CartViewItem[]>(
    () =>
      [...recurrentItems.filter((item) => item.checked), ...addedProducts].map((item) => ({
        id: item.id,
        nombre: item.nombre,
        laboratorio: item.laboratorio,
        cantidad: item.cantidad,
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
      })),
    [addedProducts, recurrentItems],
  );

  const productosConfirmacion = useMemo<ConfirmProductItem[]>(
    () =>
      cartItems.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        laboratorio: item.laboratorio,
        cantidad: item.cantidad ?? 1,
      })),
    [cartItems],
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

    if (window.localStorage.getItem(orderConfirmedStorageKey) === "true") {
      setOrderConfirmed(true);
      setOrderNumber(window.localStorage.getItem(orderCodeStorageKey));
      setStep(3);
    }
  }, [orderCodeStorageKey, orderConfirmedStorageKey, token]);

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
        setDomicilios(domiciliosList);
        setSucursales(
          Array.isArray(sucursalesData)
            ? sucursalesData
            : Array.isArray(sucursalesData.sucursales)
              ? sucursalesData.sucursales
              : [],
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
      setHasSearched(true);
      setSearchResults([]);
      setTotalResults(0);
      return;
    }

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
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setSearchLoading(false);
    }
  };

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
        },
      ];
    });
  };

  const isProductSelected = (product: Product) =>
    addedProducts.some((item) => item.id === product.id);

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

    if (typeof window !== "undefined") {
      const phone = process.env.NEXT_PUBLIC_FSA_PHONE_PORTAL;
      if (phone) {
        const message =
          "Hola, estoy armando mi pedido mensual y necesito ayuda para continuar.";
        window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      }
    }
  };

  const handleConfirmOrder = async () => {
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
        .map((item) => item.id);

      await Promise.all(
        skippedItemIds.map((itemId) =>
          fetch(`/api/magic/portal-clientes/${token}/ciclos/${tokenData.cicloId}/items/${itemId}/skipped`, {
            method: "PATCH",
          }).then(toJson<Record<string, unknown>>),
        ),
      );

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
              cantidadEnvasesPorCiclo: 1,
            }),
          }).then(toJson<Record<string, unknown>>),
        ),
      );

      const draftOrder = await fetch(`/api/magic/portal-clientes/${token}/parent-orders/draft`, {
        method: "POST",
      }).then(toJson<DraftOrderResponse>);

      if (draftOrder.id) {
        try {
          await fetch(`/api/order-cycles/parent-orders/${draftOrder.id}/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "ACCEPTED",
              reason: "Cliente confirmó en portal",
            }),
          });
        } catch {
          // No bloquea la confirmación visual si el endpoint todavía no existe.
        }
      }

      await fetch(`/api/magic/portal-clientes/${token}/movimientos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tipo: "DECISION_GUARDADA" }),
      }).then(toJson<Record<string, unknown>>);

      setOrderConfirmed(true);
      setOrderNumber(draftOrder.code ?? null);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(orderConfirmedStorageKey, "true");
        if (draftOrder.code) {
          window.localStorage.setItem(orderCodeStorageKey, draftOrder.code);
        }
      }
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

  if (loading) {
    return <Loader />;
  }

  if (submittingOrder) {
    return <OrderProcessingLoader />;
  }

  return (
    <div className={styles.root}>
      <Header
        showBackButton={step > 1 && !orderConfirmed}
        onBack={() => setStep((current) => (current === 1 ? 1 : ((current - 1) as 1 | 2 | 3)))}
        onCartClick={() => setOpenCart(true)}
        cartCount={cartItems.length}
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


        {!loading && error && !expediente && (
          <div className={`${styles.statusCard} ${styles.error}`}>
            <p className={styles.statusTitle}>{loadErrorContent?.title ?? "No pudimos abrir el portal"}</p>
            <p className={styles.statusText}>
              {loadErrorContent?.message ?? "Ocurrió un problema inesperado al cargar el portal."}
            </p>
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
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            onContinue={handleContinueToDelivery}
            onContactAdvisor={() => {
              void handleContactAdvisor();
            }}
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
              token={token}
              cicloId={tokenData?.cicloId}
              onConfirm={() => {
                void handleConfirmOrder();
              }}
              onContactAdvisor={() => {
                void handleContactAdvisor();
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}