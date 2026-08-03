"use client";

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
    <article className="sm:rounded-3xl sm:border sm:border-[#ebe6f4] sm:bg-white sm:p-6 sm:shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[#2f3042]">Tus pedidos</h3>
        <p className="text-sm text-[#5f6074]">
          Resumen de tus ultimos pedidos.
        </p>
      </div>

      {isLoading && visibleExpedientes.length === 0 ? (
        <PedidosCoraSkeleton />
      ) : error && visibleExpedientes.length === 0 ? (
        <div className="rounded-2xl border border-[#f0dde2] bg-[#fff7f8] px-4 py-3 text-sm text-[#7f1d2d]">
          No pudimos cargar tus pedidos. {error}
        </div>
      ) : visibleExpedientes.length === 0 ? (
        <p className="text-sm text-[#5f6074]">
          Todavía no hay pedidos para mostrar.
        </p>
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
                    <p className="text-sm font-semibold text-[#2f3042]">
                      {expedienteItem.titulo ?? formatExpedienteLabel(expedienteItem.expedienteId)}
                    </p>
                    {/* <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8f63d9]">
                      {expedienteItem.estado}
                    </p> */}
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
