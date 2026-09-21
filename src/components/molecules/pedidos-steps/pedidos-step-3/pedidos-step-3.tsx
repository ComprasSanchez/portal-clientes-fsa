import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import PortalStepper from "../../stepper/stepper";
import PortalButton from "@/components/atoms/button/button";
import ConfirmProductsAccordion, {
  ConfirmProductItem,
} from "../../confirm-accordion/confirm-accordion";
import ConfirmDeliveryAccordion, {
  ConfirmDeliveryData,
} from "../../confirm-delivery/confirm-delivery";
import {
  getTrackingStatus,
  PARENT_ORDER_STATUS_LABELS,
  ParentOrder,
  TRACKING_LABELS,
  TRACKING_STATUS_SEQUENCE,
  TrackingOrderStatus,
} from "@/lib/order-tracking";

type PaymentStatus = "idle" | "redirecting" | "processing" | "rejected" | "pending";

type ConfirmOrderChoice = "pagar_ahora" | "contactenme";

type PedidosStep3Props = {
  productos: ConfirmProductItem[];
  entrega: ConfirmDeliveryData | null;
  isSubmitting: boolean;
  orderConfirmed: boolean;
  orderNumber: string | null;
  paymentStatus?: PaymentStatus;
  token?: string;
  cicloId?: string;
  onConfirm: (choice: ConfirmOrderChoice) => void;
  onRetryPayment?: () => void;
  onContactAdvisor: () => void;
  onBack?: () => void;
  onRemoveProduct?: (id: string) => void;
  onChangeProductQuantity?: (id: string, delta: number) => void;
};

const PedidosStep3 = ({
  productos,
  entrega,
  isSubmitting,
  orderConfirmed,
  orderNumber,
  paymentStatus = "idle",
  token,
  cicloId,
  onConfirm,
  onRetryPayment,
  onContactAdvisor,
  onBack,
  onRemoveProduct,
  onChangeProductQuantity,
}: PedidosStep3Props) => {
  const [parentOrders, setParentOrders] = useState<ParentOrder[]>([]);
  const [trackingStatus, setTrackingStatus] =
    useState<TrackingOrderStatus>("pendiente");
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);

  useEffect(() => {
    if (!orderConfirmed || !token || !cicloId) {
      return;
    }

    let cancelled = false;

    const fetchParentOrders = async () => {
      try {
        setIsTrackingLoading(true);

        const response = await fetch(
          `/api/magic/portal-clientes/${token}/order-cycles/${cicloId}/parent-orders`,
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as ParentOrder[];
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setParentOrders(data);
          setTrackingStatus(getTrackingStatus(data[0]));
        }
      } catch {
        // No bloquea la pantalla de confirmación.
      } finally {
        if (!cancelled) {
          setIsTrackingLoading(false);
        }
      }
    };

    void fetchParentOrders();

    return () => {
      cancelled = true;
    };
  }, [cicloId, orderConfirmed, token]);

  const resolvedOrderNumber = useMemo(
    () => parentOrders[0]?.code ?? orderNumber,
    [orderNumber, parentOrders],
  );

  // "Listo para entrega o retiro" es ambiguo — una vez que sabemos qué
  // eligió el cliente, mostramos el texto específico que le corresponde.
  const logisticaLabel =
    trackingStatus === "listo_para_envio"
      ? entrega?.tipo === "sucursal"
        ? "Listo para retirar"
        : "Listo para envío"
      : TRACKING_LABELS[trackingStatus];

  if (!orderConfirmed && paymentStatus === "rejected") {
    return (
      <div className="w-full p-5">
        <div className="mx-auto flex flex-col gap-5 rounded-3xl bg-white p-6 text-center shadow-sm">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
              <XCircle size={42} />
            </div>
          </div>

          <h4 className="pt-1 text-[24px] font-bold text-[#8C6FAF]">
            No pudimos procesar el pago
          </h4>
          <p className="text-[18px] text-[#8C6FAF]">
            El pago no se pudo completar. Podés intentarlo de nuevo cuando quieras.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <PortalButton variant="primary" onClick={onRetryPayment}>
              Reintentar pago
            </PortalButton>

            <PortalButton variant="secondary" withChatIcon onClick={onContactAdvisor}>
              Hablar con CORA
            </PortalButton>
          </div>
        </div>
      </div>
    );
  }

  if (!orderConfirmed && paymentStatus === "pending") {
    return (
      <div className="w-full p-5">
        <div className="mx-auto flex flex-col gap-5 rounded-3xl bg-white p-6 text-center shadow-sm">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Clock size={42} />
            </div>
          </div>

          <h4 className="pt-1 text-[24px] font-bold text-[#8C6FAF]">
            Tu pago está pendiente de confirmación
          </h4>
          <p className="text-[18px] text-[#8C6FAF]">
            En cuanto se confirme te vamos a avisar. Podés cerrar esta pantalla tranquilo.
          </p>

          <PortalButton variant="secondary" withChatIcon onClick={onContactAdvisor}>
            Hablar con CORA
          </PortalButton>
        </div>
      </div>
    );
  }

  if (orderConfirmed) {
    return (
      <div className="w-full p-5">
        <div className="mx-auto flex flex-col gap-5 rounded-3xl bg-white p-6 text-center shadow-sm">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#8C6FAF]/12 text-[#8C6FAF]">
              <CheckCircle2 size={42} />
            </div>
          </div>

          <h4 className="pt-1 text-[24px] font-bold text-[#8C6FAF]">
            Pedido confirmado
          </h4>
          <p className="text-[18px] text-[#8C6FAF]">
            Tu pedido ya fue registrado correctamente.
          </p>

          <div className="rounded-3xl border border-[#8C6FAF]/15 bg-[#8C6FAF]/6 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8C6FAF]/65">
              Número de orden
            </p>
            <p className="mt-2 text-[32px] font-bold tracking-[0.08em] text-[#8C6FAF]">
              {resolvedOrderNumber ? `#${resolvedOrderNumber}` : "-"}
            </p>
          </div>

          <div className="grid gap-3 text-left sm:grid-cols-3">
            <div className="rounded-2xl bg-[#F7F3FB] p-4">
              <div className="mb-2 flex items-center gap-2 text-[#8C6FAF]">
                <Truck size={18} />
                <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                  Logística
                </span>
              </div>
              <p className="text-sm font-semibold text-[#8C6FAF]">
                {isTrackingLoading ? "Consultando estado..." : logisticaLabel}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F7F3FB] p-4">
              <div className="mb-2 flex items-center gap-2 text-[#8C6FAF]">
                <Clock size={18} />
                <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                  Estado
                </span>
              </div>
              <p className="text-sm font-semibold text-[#8C6FAF]">
                {parentOrders[0]?.status
                  ? (PARENT_ORDER_STATUS_LABELS[parentOrders[0].status] ?? parentOrders[0].status)
                  : "Registrado"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F7F3FB] p-4">
              <div className="mb-2 flex items-center gap-2 text-[#8C6FAF]">
                <Calendar size={18} />
                <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                  Fecha
                </span>
              </div>
              <p className="text-sm font-semibold text-[#8C6FAF]">
                {new Date().toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {parentOrders.length > 0 && (
            <div className="rounded-3xl border border-[#8C6FAF]/10 bg-white p-5 text-left">
              <div className="mb-3 flex items-center gap-2 text-[#8C6FAF]">
                <Package size={18} />
                <p className="text-sm font-bold uppercase tracking-[0.12em]">
                  Seguimiento
                </p>
              </div>

              <div className="space-y-3">
                {TRACKING_STATUS_SEQUENCE.slice(1).map((status) => {
                  const active =
                    TRACKING_STATUS_SEQUENCE.indexOf(trackingStatus) >=
                    TRACKING_STATUS_SEQUENCE.indexOf(status);

                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                          active
                            ? "border-[#8C6FAF] bg-[#8C6FAF] text-white"
                            : "border-[#8C6FAF]/20 bg-white text-[#8C6FAF]/35"
                        }`}
                      >
                        <CheckCircle2 size={14} />
                      </div>
                      <p
                        className={`text-sm ${
                          active ? "font-semibold text-[#8C6FAF]" : "text-[#8C6FAF]/55"
                        }`}
                      >
                        {TRACKING_LABELS[status]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <PortalButton variant="secondary" withChatIcon onClick={onContactAdvisor}>
            Hablar con CORA
          </PortalButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="w-full p-5">
        <h4 className="flex items-center justify-center gap-2 pt-6 text-[#8C6FAF] text-bold text-[22px]">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#ddd6eb] bg-white text-[#8C6FAF] transition hover:border-[#c4b5e0] hover:bg-[#f7f2ff]"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          Ya casi terminamos
        </h4>
        <PortalStepper currentStep={3} />
        <div className="flex flex-col pb-5">
          <p className="flex items-center justify-center text-[#8C6FAF] text-bold text-[22px]">
            Revisá tu pedido antes de confirmarlo
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <ConfirmProductsAccordion
            items={productos}
            onRemove={onRemoveProduct}
            onChangeQuantity={onChangeProductQuantity}
          />
          {entrega && <ConfirmDeliveryAccordion data={entrega} />}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {showPaymentChoice ? (
              <>
                <PortalButton
                  variant="mercadopago"
                  onClick={() => onConfirm("pagar_ahora")}
                  disabled={isSubmitting || !entrega}
                >
                  {isSubmitting ? "Confirmando pedido..." : "Pagar con Mercado Pago"}
                </PortalButton>

                <PortalButton
                  variant="secondary"
                  withChatIcon
                  onClick={() => onConfirm("contactenme")}
                  disabled={isSubmitting || !entrega}
                >
                  {isSubmitting ? "Confirmando pedido..." : "Hablar con CORA"}
                </PortalButton>
              </>
            ) : (
              <>
                <PortalButton
                  variant="primary"
                  onClick={() => setShowPaymentChoice(true)}
                  disabled={isSubmitting || !entrega}
                >
                  Continuar
                </PortalButton>

                <PortalButton variant="secondary" withChatIcon onClick={onContactAdvisor}>
                  Hablar con CORA
                </PortalButton>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidosStep3;