"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CalendarDays, ShieldCheck } from "lucide-react";
import { usePortalExpedienteActual } from "@/lib/use-portal-expediente-actual";
import {
  formatPortalProfileDate,
  pickPreferredAfiliacion,
  pickPreferredContacto,
  pickPreferredDomicilio,
} from "@/lib/portal-profile";
import type {
  PortalExpedienteItem,
  PortalExpedientesResponse,
} from "@/types/portal-expedientes";
import type { PortalPerfilResponse } from "@/types/portal-profile";
import type { CreatedExpedienteSummary } from "@/types/portal-expediente-mutations";
import { CreateExpedienteForm } from "./CreateExpedienteForm";
import { EditExpedienteForm } from "./EditExpedienteForm";
import { ExpedientesList } from "./ExpedientesList";
import { formatExpedienteLabel } from "../../../helpers/expedientes-management.helpers";

type ExpedientesManagementViewProps = {
  perfil: PortalPerfilResponse | null;
  expedientes: PortalExpedienteItem[];
  activeExpedienteId: string | null;
  refreshExpedientes: () => Promise<PortalExpedientesResponse | null>;
  isExpedientesLoading?: boolean;
  expedientesError?: string | null;
};

export function ExpedientesManagementView({
  perfil,
  expedientes,
  activeExpedienteId,
  refreshExpedientes,
  isExpedientesLoading,
  expedientesError,
}: ExpedientesManagementViewProps) {
  const {
    expediente,
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

  const hasVerifiedContact = verifiedContacts.length > 0;

  const [editExpedienteId, setEditExpedienteId] = useState<string | null>(activeExpedienteId);
  const [hasManualSelection, setHasManualSelection] = useState(false);
  const [createdSummary, setCreatedSummary] = useState<CreatedExpedienteSummary | null>(null);

  const handleSelectExpedienteForEdit = (item: PortalExpedienteItem) => {
    setHasManualSelection(true);
    setEditExpedienteId(item.expedienteId);
  };

  const editingItem = expedientes.find((item) => item.expedienteId === editExpedienteId) ?? null;

  return (
    <section className="space-y-6">
      {createdSummary ? (
        <article className="rounded-3xl border border-[#dcd0f4] bg-[#faf7ff] p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8f63d9]">
            Alta confirmada
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[#2f3042]">Tu pedido ya fue creado</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f63d9]">
                Pedido
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
            <span
              className={`rounded-2xl p-3 ${hasVerifiedContact ? "bg-[#eef9f1] text-[#22643a]" : "bg-[#fff3f4] text-[#a53c52]"}`}
            >
              <ShieldCheck size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#2f3042]">Contacto verificado</p>
              <p className="mt-1 text-sm text-[#5f6074]">
                {hasVerifiedContact
                  ? "Podemos comunicarnos con vos para coordinar cada entrega. Asegurate de tener tu teléfono o email siempre actualizados."
                  : "Necesitás verificar al menos un teléfono o email antes de crear un pedido. Podés hacerlo desde tu perfil."}
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
                Una vez hecho el pedido, un asesor se pondrá en contacto para confirmar los detalles y coordinar tu entrega.
              </p>
            </div>
          </div>
        </article>
      </div>

      <div className="grid gap-6">
        <CreateExpedienteForm
          hasVerifiedContact={hasVerifiedContact}
          preferredVerifiedContact={preferredVerifiedContact}
          preferredAfiliacionId={preferredAfiliacionId}
          refreshExpedientes={refreshExpedientes}
          refreshExpedienteActual={refreshExpedienteActual}
          onCreated={setCreatedSummary}
        />

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
      </div>

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
