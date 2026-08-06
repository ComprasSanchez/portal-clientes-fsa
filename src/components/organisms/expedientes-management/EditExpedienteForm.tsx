"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FilePenLine, RotateCcw } from "lucide-react";
import { useGlobalToast } from "@/components/ui/global-toast";
import { SucursalPickerField } from "@/components/molecules/expedientes/SucursalPickerField";
import type {
  PortalPerfilAfiliacion,
  PortalPerfilContacto,
  PortalPerfilDomicilio,
} from "@/types/portal-profile";
import type {
  PortalExpedienteItem,
  PortalExpedientesResponse,
} from "@/types/portal-expedientes";
import type { PortalExpedienteActualExpediente } from "@/types/portal-expediente-actual";
import type { PortalSucursalOption } from "@/types/portal-sucursales";
import type { PortalUpdateExpedienteRequest } from "@/types/portal-expediente-mutations";
import {
  DELIVERY_OPTIONS,
  PAYMENT_OPTIONS,
  getAfiliacionLabel,
  getContactoLabel,
  getDomicilioLabel,
  getDomicilioValue,
  toInputDate,
  todayIso,
} from "../../../helpers/expedientes-management.helpers";

interface EditFormValues {
  titulo: string;
  contactoId: string;
  afiliacionOSId: string;
  medioEntrega: string;
  domicilioEntregaId: string;
  sucursalEntregaId: string;
  medioPago: string;
  fechaInicioCicloBase: string;
  fechaObjetivoEntrega: string;
}

interface ExpedienteActualBundle {
  expediente: PortalExpedienteActualExpediente | null;
  sucursalEntrega: PortalSucursalOption | null;
  isLoading: boolean;
  error: string | null;
  isNotFound: boolean;
}

interface EditExpedienteFormProps {
  editingItem: PortalExpedienteItem | null;
  hasManualSelection: boolean;
  expedienteActual: ExpedienteActualBundle;
  verifiedContacts: PortalPerfilContacto[];
  afiliaciones: PortalPerfilAfiliacion[];
  domicilios: PortalPerfilDomicilio[];
  preferredVerifiedContact: PortalPerfilContacto | null;
  preferredAfiliacionId: string;
  preferredDomicilioId: string;
  hasVerifiedContact: boolean;
  refreshExpedientes: () => Promise<PortalExpedientesResponse | null>;
  refreshExpedienteActual: () => Promise<unknown>;
}

const buildEmptyValues = (): EditFormValues => ({
  titulo: "",
  contactoId: "",
  afiliacionOSId: "",
  medioEntrega: "",
  domicilioEntregaId: "",
  sucursalEntregaId: "",
  medioPago: "",
  fechaInicioCicloBase: "",
  fechaObjetivoEntrega: "",
});

const mapExpedienteActualToValues = (
  expediente: PortalExpedienteActualExpediente,
  preferredContactoId: string,
  preferredAfiliacionId: string,
  preferredDomicilioId: string,
): EditFormValues => ({
  titulo: expediente.titulo ?? "",
  contactoId: expediente.contactoId ?? preferredContactoId,
  afiliacionOSId: expediente.afiliacionOSId ?? preferredAfiliacionId,
  medioEntrega: expediente.medioEntrega ?? "",
  domicilioEntregaId: expediente.domicilioEntregaId ?? preferredDomicilioId,
  sucursalEntregaId:
    expediente.sucursalEntregaId !== null && expediente.sucursalEntregaId !== undefined
      ? String(expediente.sucursalEntregaId)
      : "",
  medioPago: expediente.medioPago ?? "",
  fechaInicioCicloBase: toInputDate(expediente.fechaInicioCicloBase),
  fechaObjetivoEntrega: toInputDate(expediente.proximaFechaEntregaForzada),
});

const mapExpedienteItemToValues = (
  item: PortalExpedienteItem,
  preferredContactoId: string,
  preferredAfiliacionId: string,
  preferredDomicilioId: string,
): EditFormValues => ({
  titulo: item.titulo ?? "",
  contactoId: item.contactoId ?? preferredContactoId,
  afiliacionOSId: item.afiliacionOSId ?? preferredAfiliacionId,
  medioEntrega: item.medioEntrega ?? "",
  domicilioEntregaId: item.domicilioEntregaId ?? preferredDomicilioId,
  sucursalEntregaId: item.sucursalEntregaId != null ? String(item.sucursalEntregaId) : "",
  medioPago: item.medioPago ?? "",
  fechaInicioCicloBase: toInputDate(item.openedAt),
  fechaObjetivoEntrega: toInputDate(item.nextActionAt),
});

export function EditExpedienteForm({
  editingItem,
  hasManualSelection,
  expedienteActual,
  verifiedContacts,
  afiliaciones,
  domicilios,
  preferredVerifiedContact,
  preferredAfiliacionId,
  preferredDomicilioId,
  hasVerifiedContact,
  refreshExpedientes,
  refreshExpedienteActual,
}: EditExpedienteFormProps) {
  const { pushToast } = useGlobalToast();
  const [seedSucursal, setSeedSucursal] = useState<PortalSucursalOption | null>(null);
  const lastLoadedIdRef = useRef<string | null>(null);
  const preferredContactoId = preferredVerifiedContact?.id ?? "";

  const verifiedContactIds = useMemo(
    () => new Set(verifiedContacts.map((contacto) => contacto.id)),
    [verifiedContacts],
  );

  const editSchema = useMemo(
    () =>
      Yup.object({
        titulo: Yup.string().trim().required("Ingresá un título para el pedido."),
        contactoId: Yup.string()
          .required("Seleccioná un contacto verificado.")
          .test("verified", "El contacto seleccionado debe estar verificado.", (value) =>
            Boolean(value && verifiedContactIds.has(value)),
          ),
        medioEntrega: Yup.string().required("Seleccioná una forma de entrega."),
        domicilioEntregaId: Yup.string().when("medioEntrega", {
          is: "ENVIO_DOMICILIO",
          then: (schema) => schema.required("Seleccioná un domicilio para la entrega."),
        }),
        sucursalEntregaId: Yup.string().when("medioEntrega", {
          is: "RETIRA_SUCURSAL",
          then: (schema) => schema.required("Seleccioná una sucursal para el retiro."),
        }),
        fechaInicioCicloBase: Yup.string().required("Ingresá la fecha de inicio del ciclo."),
        fechaObjetivoEntrega: Yup.string().test(
          "not-in-past",
          "La fecha objetivo de entrega no puede ser anterior a hoy.",
          (value) => !value || value >= todayIso(),
        ),
      }),
    [verifiedContactIds],
  );

  const formik = useFormik<EditFormValues>({
    initialValues: buildEmptyValues(),
    validationSchema: editSchema,
    onSubmit: async (values, helpers) => {
      const targetExpedienteId = editingItem?.expedienteId ?? expedienteActual.expediente?.id ?? null;
      if (!targetExpedienteId) {
        pushToast({
          title: "No hay pedido seleccionado para editar",
          description: "Seleccioná un pedido de la lista para poder editarlo.",
          variant: "error",
        });
        return;
      }

      const payload: PortalUpdateExpedienteRequest = {
        titulo: values.titulo.trim(),
        contactoId: values.contactoId || null,
        afiliacionOSId: values.afiliacionOSId || null,
        medioEntrega: values.medioEntrega || null,
        domicilioEntregaId:
          values.medioEntrega === "ENVIO_DOMICILIO" ? values.domicilioEntregaId || null : null,
        sucursalEntregaId:
          values.medioEntrega === "RETIRA_SUCURSAL" && values.sucursalEntregaId
            ? Number(values.sucursalEntregaId)
            : null,
        medioPago: values.medioPago || null,
        proximaFechaEntregaForzada: values.fechaObjetivoEntrega || null,
      };

      try {
        const response = await fetch(`/api/portal/me/expedientes/${targetExpedienteId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = (response.headers.get("content-type") || "").includes("application/json")
          ? ((await response.json().catch(() => null)) as { error?: string; message?: string } | null)
          : null;

        if (!response.ok) {
          throw new Error(
            data?.message || data?.error || "No pudimos actualizar el pedido actual.",
          );
        }

        pushToast({
          title: "Pedido actualizado",
          description: "Actualizamos los datos del pedido activo.",
          variant: "success",
        });

        helpers.resetForm({ values });
        await Promise.all([refreshExpedientes(), refreshExpedienteActual()]);
      } catch (error) {
        pushToast({
          title: "No pudimos actualizar el pedido",
          description: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
          variant: "error",
        });
      }
    },
  });

  const { resetForm } = formik;

  useEffect(() => {
    if (hasManualSelection) return;
    const { expediente } = expedienteActual;
    if (!expediente) return;
    if (lastLoadedIdRef.current === expediente.id) return;
    lastLoadedIdRef.current = expediente.id;
    resetForm({
      values: mapExpedienteActualToValues(
        expediente,
        preferredContactoId,
        preferredAfiliacionId,
        preferredDomicilioId,
      ),
    });
    setSeedSucursal(expedienteActual.sucursalEntrega);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expedienteActual.expediente, hasManualSelection]);

  useEffect(() => {
    if (!editingItem) return;
    if (lastLoadedIdRef.current === editingItem.expedienteId) return;
    lastLoadedIdRef.current = editingItem.expedienteId;
    resetForm({
      values: mapExpedienteItemToValues(
        editingItem,
        preferredContactoId,
        preferredAfiliacionId,
        preferredDomicilioId,
      ),
    });
    setSeedSucursal(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingItem]);

  const handleMedioEntregaChange = (value: string) => {
    formik.setValues({
      ...formik.values,
      medioEntrega: value,
      domicilioEntregaId:
        value === "ENVIO_DOMICILIO"
          ? formik.values.domicilioEntregaId || preferredDomicilioId
          : "",
      sucursalEntregaId: value === "RETIRA_SUCURSAL" ? formik.values.sucursalEntregaId : "",
    });
    if (value !== "RETIRA_SUCURSAL") {
      setSeedSucursal(null);
    }
  };

  const canShowEditForm =
    editingItem !== null || (!!expedienteActual.expediente && !expedienteActual.isLoading);

  return (
    <article className="rounded-3xl border border-[#ebe6f4] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-[#eef6ff] p-3 text-[#1f5ea8]">
            <FilePenLine size={20} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-[#2f3042]">
              {editingItem?.titulo ? `Editando: ${editingItem.titulo}` : "Editar pedido"}
            </h3>
            <p className="text-sm text-[#5f6074]">
              {editingItem
                ? "Modificá los datos y guardá los cambios."
                : "Seleccioná un pedido de la lista para editarlo."}
            </p>
          </div>
        </div>
        {editingItem && formik.dirty ? (
          <button
            type="button"
            onClick={() => resetForm()}
            className="flex items-center gap-1.5 rounded-2xl border border-[#ddd6eb] px-3 py-2 text-sm text-[#5f6074] transition hover:border-[#c4b5e0] hover:text-[#2f3042]"
            title="Descartar cambios"
          >
            <RotateCcw size={14} />
            Restaurar
          </button>
        ) : null}
      </div>

      {!editingItem && expedienteActual.isLoading ? (
        <p className="text-sm text-[#5f6074]">Cargando pedido...</p>
      ) : null}

      {!editingItem &&
      !expedienteActual.isLoading &&
      (expedienteActual.error || expedienteActual.isNotFound || !expedienteActual.expediente) ? (
        <div className="rounded-2xl border border-[#f0dde2] bg-[#fff7f8] px-4 py-3 text-sm text-[#7f1d2d]">
          {expedienteActual.error || "No encontramos un pedido disponible para editar."}
        </div>
      ) : null}

      {canShowEditForm ? (
        <form className="grid gap-4 md:grid-cols-2" onSubmit={formik.handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#2f3042]">Título del pedido</span>
            <input
              name="titulo"
              className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
              value={formik.values.titulo}
              onChange={formik.handleChange}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#2f3042]">Contacto verificado</span>
            <select
              name="contactoId"
              className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
              value={formik.values.contactoId}
              onChange={formik.handleChange}
            >
              <option value="">Seleccioná un contacto</option>
              {verifiedContacts.map((contacto) => (
                <option key={contacto.id} value={contacto.id}>
                  {getContactoLabel(contacto)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#2f3042]">Afiliación</span>
            <select
              name="afiliacionOSId"
              className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
              value={formik.values.afiliacionOSId}
              onChange={formik.handleChange}
            >
              <option value="">Sin afiliación</option>
              {afiliaciones.map((afiliacion, index) => {
                const optionValue = afiliacion.obraSocialId ?? `${afiliacion.planId ?? "plan"}-${index}`;

                return (
                  <option key={optionValue} value={afiliacion.obraSocialId ?? ""}>
                    {getAfiliacionLabel(afiliacion)}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#2f3042]">Forma de entrega</span>
            <select
              className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
              value={formik.values.medioEntrega}
              onChange={(event) => handleMedioEntregaChange(event.target.value)}
            >
              {DELIVERY_OPTIONS.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {formik.values.medioEntrega === "ENVIO_DOMICILIO" ? (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#2f3042]">Domicilio de entrega</span>
              <select
                name="domicilioEntregaId"
                className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
                value={formik.values.domicilioEntregaId}
                onChange={formik.handleChange}
              >
                <option value="">Seleccioná un domicilio</option>
                {domicilios.map((domicilio) => (
                  <option key={getDomicilioValue(domicilio)} value={domicilio.id ?? ""}>
                    {getDomicilioLabel(domicilio)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {formik.values.medioEntrega === "RETIRA_SUCURSAL" ? (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#2f3042]">Sucursal de retiro</span>
              <SucursalPickerField
                value={formik.values.sucursalEntregaId}
                initialSucursal={seedSucursal}
                onChange={(sucursalId) => formik.setFieldValue("sucursalEntregaId", sucursalId)}
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#2f3042]">Forma de pago</span>
            <select
              name="medioPago"
              className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
              value={formik.values.medioPago}
              onChange={formik.handleChange}
            >
              {PAYMENT_OPTIONS.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#2f3042]">Inicio del ciclo</span>
            <input
              type="date"
              className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
              value={formik.values.fechaInicioCicloBase}
              readOnly
              disabled
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#2f3042]">Fecha objetivo de entrega</span>
            <input
              type="date"
              name="fechaObjetivoEntrega"
              className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
              value={formik.values.fechaObjetivoEntrega}
              onChange={formik.handleChange}
            />
          </label>

          <div className="rounded-2xl border border-dashed border-[#ddd6eb] bg-[#faf8fd] px-4 py-3 text-sm text-[#5f6074] md:col-span-2">
            Los cambios se reflejan en el portal una vez confirmados. Si tenés dudas sobre algún dato, consultá con tu asesor.
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={formik.isSubmitting || !hasVerifiedContact || !formik.dirty}
              className="inline-flex items-center justify-center rounded-2xl bg-[#1f5ea8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#184a84] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {formik.isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      ) : null}
    </article>
  );
}
