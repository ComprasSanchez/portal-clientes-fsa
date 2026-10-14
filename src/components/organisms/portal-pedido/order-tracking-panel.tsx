"use client";

import PortalButton from "@/components/atoms/button/button";
import StatTile from "@/components/molecules/stat-tile/stat-tile";
import Timeline from "@/components/molecules/timeline/timeline";
import {
  getTrackingTimelineSteps,
  PARENT_ORDER_STATUS_LABELS,
  ParentOrder,
  TRACKING_LABELS,
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

      <h2 className="pt-1 cora-title-section text-[#8C6FAF]">Pedido registrado</h2>
      <p className="cora-read text-[#8C6FAF]">Tu solicitud ya está en seguimiento logístico.</p>

      <div className="rounded-3xl border border-[#8C6FAF]/15 bg-[#8C6FAF]/6 p-5">
        <p className="cora-data-label uppercase tracking-[0.22em] text-[#8C6FAF]/65">
          Número de orden
        </p>
        <p className="mt-2 text-[32px] font-bold tracking-[0.08em] text-[#8C6FAF]">
          {resolvedOrderNumber ? `#${resolvedOrderNumber}` : "-"}
        </p>
      </div>

      <div className="grid gap-3 text-left sm:grid-cols-3">
        <StatTile
          variant="soft"
          size="sm"
          tone="cora-portal"
          icon={<Truck size={18} />}
          label="Logística"
          value={TRACKING_LABELS[trackingStatus]}
        />
        <StatTile
          variant="soft"
          size="sm"
          tone="cora-portal"
          icon={<Clock size={18} />}
          label="Estado"
          value={
            latestParentOrder.status
              ? (PARENT_ORDER_STATUS_LABELS[latestParentOrder.status] ?? latestParentOrder.status)
              : "Registrado"
          }
        />
        <StatTile
          variant="soft"
          size="sm"
          tone="cora-portal"
          icon={<Calendar size={18} />}
          label="Fecha"
          value={new Date().toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        />
      </div>

      <div className="rounded-3xl border border-[#8C6FAF]/10 bg-white p-5 text-left">
        <div className="mb-3 flex items-center gap-2 text-[#8C6FAF]">
          <Package size={18} />
          <p className="cora-data-label uppercase tracking-[0.12em]">Seguimiento</p>
        </div>
        <Timeline
          variant="compact"
          tone="cora-portal"
          steps={getTrackingTimelineSteps(trackingStatus)}
        />
      </div>

      {onRefresh ? (
        <PortalButton variant="secondary" onClick={onRefresh}>
          Actualizar estado
        </PortalButton>
      ) : null}
    </div>
  );
}