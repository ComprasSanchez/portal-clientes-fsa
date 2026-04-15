"use client";

import PortalButton from "@/components/atoms/button/button";
import {
  PARENT_ORDER_STATUS_LABELS,
  ParentOrder,
  TRACKING_LABELS,
  TRACKING_STATUS_SEQUENCE,
  TrackingOrderStatus,
} from "@/lib/order-tracking";
import { Calendar, CheckCircle2, Clock, Package, Truck } from "lucide-react";

type OrderTrackingPanelProps = {
  latestParentOrder: ParentOrder;
  trackingStatus: TrackingOrderStatus;
  resolvedOrderNumber: string | null;
  onRefresh?: () => void;
};

export function OrderTrackingPanel({
  latestParentOrder,
  trackingStatus,
  resolvedOrderNumber,
  onRefresh,
}: OrderTrackingPanelProps) {
  return (
    <div className="mx-auto flex flex-col gap-5 rounded-3xl bg-white p-6 text-center shadow-sm">
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#8C6FAF]/12 text-[#8C6FAF]">
          <CheckCircle2 size={42} />
        </div>
      </div>

      <h2 className="pt-1 text-[24px] font-bold text-[#8C6FAF]">Pedido registrado</h2>
      <p className="text-[18px] text-[#8C6FAF]">Tu solicitud ya está en seguimiento logístico.</p>

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
            <span className="text-xs font-semibold uppercase tracking-[0.12em]">Logística</span>
          </div>
          <p className="text-sm font-semibold text-[#8C6FAF]">{TRACKING_LABELS[trackingStatus]}</p>
        </div>

        <div className="rounded-2xl bg-[#F7F3FB] p-4">
          <div className="mb-2 flex items-center gap-2 text-[#8C6FAF]">
            <Clock size={18} />
            <span className="text-xs font-semibold uppercase tracking-[0.12em]">Estado</span>
          </div>
          <p className="text-sm font-semibold text-[#8C6FAF]">
            {latestParentOrder.status
              ? (PARENT_ORDER_STATUS_LABELS[latestParentOrder.status] ?? latestParentOrder.status)
              : "Registrado"}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F7F3FB] p-4">
          <div className="mb-2 flex items-center gap-2 text-[#8C6FAF]">
            <Calendar size={18} />
            <span className="text-xs font-semibold uppercase tracking-[0.12em]">Fecha</span>
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

      <div className="rounded-3xl border border-[#8C6FAF]/10 bg-white p-5 text-left">
        <div className="mb-3 flex items-center gap-2 text-[#8C6FAF]">
          <Package size={18} />
          <p className="text-sm font-bold uppercase tracking-[0.12em]">Seguimiento</p>
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

      {onRefresh ? (
        <PortalButton variant="secondary" onClick={onRefresh}>
          Actualizar estado
        </PortalButton>
      ) : null}
    </div>
  );
}