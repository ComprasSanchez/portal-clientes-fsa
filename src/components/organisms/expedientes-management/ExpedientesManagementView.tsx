"use client";

import { useState } from "react";
import { AlertCircle, CalendarDays, ShieldCheck } from "lucide-react";
import { usePortalExpedienteActual } from "@/lib/use-portal-expediente-actual";
import { usePreferredPortalProfile } from "@/lib/use-preferred-portal-profile";
import type {
  PortalExpedienteItem,
  PortalExpedientesResponse,
} from "@/types/portal-expedientes";
import type { PortalPerfilResponse } from "@/types/portal-profile";
import type { HomeView } from "@/types/home";
import { EditExpedienteForm } from "./EditExpedienteForm";
import { ExpedientesList } from "./ExpedientesList";

type ExpedientesManagementViewProps = {
  perfil: PortalPerfilResponse | null;
  expedientes: PortalExpedienteItem[];
  activeExpedienteId: string | null;
  refreshExpedientes: () => Promise<PortalExpedientesResponse | null>;
  isExpedientesLoading?: boolean;
  expedientesError?: string | null;
  onNavigate: (view: HomeView) => void;
};

export function ExpedientesManagementView({
  perfil,
  expedientes,
  activeExpedienteId,
  refreshExpedientes,
  isExpedientesLoading,
  expedientesError,
  onNavigate,
}: ExpedientesManagementViewProps) {
  const {
    expediente,
    sucursalEntrega,
    isLoading: isLoadingExpedienteActual,
    error: expedienteActualError,
    isNotFound: expedienteActualNotFound,
    refresh: refreshExpedienteActual,
  } = usePortalExpedienteActual({ enabled: true });

  const {
    afiliaciones,
    domicilios,
    verifiedContacts,
    hasVerifiedContact,
    preferredVerifiedContact,
    preferredAfiliacionId,
    preferredDomicilioId,
  } = usePreferredPortalProfile(perfil);

  const [editExpedienteId, setEditExpedienteId] = useState<string | null>(
    activeExpedienteId,
  );
  const [hasManualSelection, setHasManualSelection] = useState(false);

  const handleSelectExpedienteForEdit = (item: PortalExpedienteItem) => {
    setHasManualSelection(true);
    setEditExpedienteId(item.expedienteId);
  };

  const editingItem =
    expedientes.find((item) => item.expedienteId === editExpedienteId) ?? null;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-[36px] font-semibold uppercase text-[#8f63d9]">MI HISTORIAL</h3>
          <p className="text-xl font-normal text-[#2f3042]">Contame qué medicación tomás y yo me ocupo del resto</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-3xl border border-[#ebe6f4] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span
              className={`rounded-2xl p-3 ${hasVerifiedContact ? "bg-[#eef9f1] text-[#22643a]" : "bg-[#fff3f4] text-[#a53c52]"}`}
            >
              <ShieldCheck size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#2f3042]">
                Contacto verificado
              </p>
              <p className="mt-1 text-sm text-[#5f6074]">
                Mantené tu teléfono o email actualizados para que pueda
                comunicarme con vos.
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
              <p className="text-sm font-semibold text-[#2f3042]">
                Fecha de entrega
              </p>
              <p className="mt-1 text-sm text-[#5f6074]">
                Elegí cuándo necesitás tu medicación. Yo me encargo del resto.
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
              <p className="text-sm font-semibold text-[#2f3042]">
                ¿Qué pasa después?
              </p>
              <p className="mt-1 text-sm text-[#5f6074]">
                Cuando termines, voy a comunicarme con vos para coordinar la
                primera entrega.
              </p>
            </div>
          </div>
        </article>
      </div>

      {/* <EditExpedienteForm
        editingItem={editingItem}
        hasManualSelection={hasManualSelection}
        expedienteActual={{
          expediente,
          sucursalEntrega,
          isLoading: isLoadingExpedienteActual,
          error: expedienteActualError,
          isNotFound: expedienteActualNotFound,
        }}
        verifiedContacts={verifiedContacts}
        afiliaciones={afiliaciones}
        domicilios={domicilios}
        preferredVerifiedContact={preferredVerifiedContact}
        preferredAfiliacionId={preferredAfiliacionId}
        preferredDomicilioId={preferredDomicilioId}
        hasVerifiedContact={hasVerifiedContact}
        refreshExpedientes={refreshExpedientes}
        refreshExpedienteActual={refreshExpedienteActual}
      /> */}

      <ExpedientesList
        expedientes={expedientes}
        activeExpedienteId={activeExpedienteId}
        selectedForEditId={editExpedienteId}
        onSelect={handleSelectExpedienteForEdit}
        isLoading={isExpedientesLoading}
        error={expedientesError}
      />
    </section>
  );
}