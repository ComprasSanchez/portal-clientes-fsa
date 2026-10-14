"use client";

import { CircleAlert, ClipboardList } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import Badge from "@/components/atoms/badge/badge";
import EmptyState from "@/components/molecules/empty-state/empty-state";
import { formatPortalProfileDate } from "@/lib/portal-profile";
import type { PortalExpedienteItem } from "@/types/portal-expedientes";
import { formatExpedienteLabel } from "../../../helpers/expedientes-management.helpers";
import { PedidosCoraSkeleton } from "@/components/organisms/loading/ViewSkeletons";

interface ExpedientesListProps {
  expedientes: PortalExpedienteItem[];
  activeExpedienteId: string | null;
  selectedForEditId: string | null;
  onSelect: (item: PortalExpedienteItem) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ExpedientesList({
  expedientes,
  activeExpedienteId,
  selectedForEditId,
  onSelect,
  isLoading,
  error,
}: ExpedientesListProps) {
  const visibleExpedientes = expedientes.filter(
    (item) => item.estado?.toUpperCase() !== "CANCELADO",
  );

  return (
    <article>
      {isLoading && visibleExpedientes.length === 0 ? (
        <PedidosCoraSkeleton />
      ) : error && visibleExpedientes.length === 0 ? (
        <Alert icon={<CircleAlert size={18} />}>
          No pudimos cargar tus pedidos. {error}
        </Alert>
      ) : visibleExpedientes.length === 0 ? (
        <EmptyState
          variant="plain"
          tone="cora"
          icon={ClipboardList}
          text="Todavía no hay pedidos para mostrar."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleExpedientes.map((expedienteItem) => {
            const isActive = expedienteItem.expedienteId === activeExpedienteId;
            const isSelectedForEdit = expedienteItem.expedienteId === selectedForEditId;

            return (
              <button
                key={expedienteItem.expedienteId}
                type="button"
                onClick={() => onSelect(expedienteItem)}
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
                    <p className="cora-card-subtitle text-[#2f3042]">
                      {expedienteItem.titulo ?? formatExpedienteLabel(expedienteItem.expedienteId)}
                    </p>
                    {/* <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8f63d9]">
                      {expedienteItem.estado}
                    </p> */}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {isActive ? (
                      <Badge color="solid" tone="cora">
                        Activo
                      </Badge>
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
                    <dt>Próximo contacto</dt>
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
  );
}
