"use client";

import { useState } from "react";
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
          <h3 className="cora-title-page text-[#8f63d9]">Mi historial</h3>
          <p className="cora-read text-[#2f3042]">Acá podés ver tus últimos pedidos</p>
        </div>
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