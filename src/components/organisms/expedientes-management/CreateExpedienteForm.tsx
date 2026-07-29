"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Clock, FilePlus2, Info } from "lucide-react";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "@heroui/react";
import { useGlobalToast } from "@/components/ui/global-toast";
import { ProductSearchField } from "@/components/molecules/expedientes/ProductSearchField";
import { formatPortalProfileDate } from "@/lib/portal-profile";
import type { PortalPerfilContacto } from "@/types/portal-profile";
import type {
  PortalExpedientesResponse,
} from "@/types/portal-expedientes";
import type {
  CreatedExpedienteSummary,
  PortalCreateExpedienteRequest,
  PortalCreateExpedienteResponse,
} from "@/types/portal-expediente-mutations";
import type { SelectedProductState } from "@/types/portal-productos";
import {
  DEFAULT_ANTICIPACION_DIAS,
  getAutoTitulo,
  subtractDaysFromIsoDate,
  todayIso,
} from "../../../helpers/expedientes-management.helpers";

interface InfoTooltipProps {
  label: string;
}

const InfoTooltip = ({ label }: InfoTooltipProps) => (
  <TooltipRoot delay={150}>
    <TooltipTrigger className="inline-flex items-center rounded-full p-0 align-middle text-[#8f7fa0] hover:text-[#8f63d9]">
      <Info size={14} />
    </TooltipTrigger>
    <TooltipContent showArrow className="max-w-[260px] text-xs">
      {label}
    </TooltipContent>
  </TooltipRoot>
);

interface CreateExpedienteFormProps {
  hasVerifiedContact: boolean;
  preferredVerifiedContact: PortalPerfilContacto | null;
  preferredAfiliacionId: string;
  refreshExpedientes: () => Promise<PortalExpedientesResponse | null>;
  refreshExpedienteActual: () => Promise<unknown>;
  onCreated: (summary: CreatedExpedienteSummary) => void;
}

interface CreateFormValues {
  fechaInicioCicloBase: string;
  fechaObjetivoEntrega: string;
  items: SelectedProductState[];
}

const buildInitialValues = (): CreateFormValues => ({
  fechaInicioCicloBase: todayIso(),
  fechaObjetivoEntrega: "",
  items: [],
});

const createSchema = Yup.object({
  fechaInicioCicloBase: Yup.string().required("Ingresá la fecha de inicio del ciclo."),
  fechaObjetivoEntrega: Yup.string()
    .required("Ingresá la fecha objetivo de entrega.")
    .test(
      "not-in-past",
      "La fecha objetivo de entrega no puede ser anterior a hoy.",
      (value) => !value || value >= todayIso(),
    ),
  items: Yup.array()
    .of(
      Yup.object({
        id: Yup.string().required(),
        nombre: Yup.string().required(),
        laboratorio: Yup.string().required(),
        periodoDias: Yup.string()
          .required()
          .test("valid-periodo", "invalid", (value) => {
            const parsed = Number(value);
            return Number.isInteger(parsed) && parsed > 0;
          }),
      }),
    )
    .min(1, "Seleccioná al menos un producto para crear el pedido."),
});

export function CreateExpedienteForm({
  hasVerifiedContact,
  preferredVerifiedContact,
  preferredAfiliacionId,
  refreshExpedientes,
  refreshExpedienteActual,
  onCreated,
}: CreateExpedienteFormProps) {
  const { pushToast } = useGlobalToast();
  const [productSearchResetKey, setProductSearchResetKey] = useState(0);

  const formik = useFormik<CreateFormValues>({
    initialValues: buildInitialValues(),
    validationSchema: createSchema,
    onSubmit: async (values, helpers) => {
      if (!hasVerifiedContact) {
        pushToast({
          title: "No pudimos crear el pedido",
          description: "Necesitás un contacto verificado antes de crear un pedido.",
          variant: "error",
        });
        return;
      }

      const payload: PortalCreateExpedienteRequest = {
        titulo: getAutoTitulo(values.items),
        contactoId: preferredVerifiedContact?.id ?? null,
        afiliacionOSId: preferredAfiliacionId || null,
        anticipacionDias: DEFAULT_ANTICIPACION_DIAS,
        medioEntrega: null,
        domicilioEntregaId: null,
        sucursalEntregaId: null,
        medioPago: null,
        fechaInicioCicloBase: values.fechaInicioCicloBase || null,
        proximaFechaEntregaForzada: values.fechaObjetivoEntrega || null,
        items: values.items.map((product) => ({
          productoIdOrSkuExt: product.id,
          productoNombre: product.nombre,
          marcaNombre: product.laboratorio,
          activo: true,
          periodoDias: Number(product.periodoDias),
        })),
      };

      try {
        const response = await fetch("/api/portal/me/expedientes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = (response.headers.get("content-type") || "").includes("application/json")
          ? ((await response.json().catch(() => null)) as PortalCreateExpedienteResponse | { error?: string; message?: string } | null)
          : null;

        if (!response.ok) {
          const message =
            (data && "message" in data && typeof data.message === "string" && data.message) ||
            (data && "error" in data && typeof data.error === "string" && data.error) ||
            "No pudimos crear el pedido.";
          throw new Error(message);
        }

        const createResult =
          data && "expedienteId" in data ? (data as PortalCreateExpedienteResponse) : null;

        pushToast({
          title: "Pedido creado",
          description: "La solicitud se envió correctamente. Vamos a refrescar tus pedidos.",
          variant: "success",
        });

        helpers.resetForm({ values: buildInitialValues() });
        setProductSearchResetKey((current) => current + 1);

        const [expedientesData] = await Promise.all([
          refreshExpedientes(),
          refreshExpedienteActual(),
        ]);

        const createdExpediente =
          expedientesData?.data.items.find(
            (item) => item.expedienteId === createResult?.expedienteId,
          ) ?? null;

        onCreated({
          expedienteId: createResult?.expedienteId ?? "",
          fechaObjetivoEntrega:
            createdExpediente?.cicloActual?.fechaEntregaObjetivo ??
            payload.proximaFechaEntregaForzada ??
            null,
          fechaPrimerContacto: createdExpediente?.cicloActual?.fechaInicioGestion ?? null,
        });
      } catch (error) {
        pushToast({
          title: "No pudimos crear el pedido",
          description: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
          variant: "error",
        });
      }
    },
  });

  const itemsError =
    typeof formik.errors.items === "string"
      ? formik.errors.items
      : Array.isArray(formik.errors.items) && formik.touched.items
        ? "Cada producto debe tener una cadencia válida en días."
        : undefined;

  const fechaContactoEstimada = formik.values.fechaObjetivoEntrega
    ? subtractDaysFromIsoDate(
        formik.values.fechaObjetivoEntrega,
        DEFAULT_ANTICIPACION_DIAS,
      )
    : null;

  return (
    <article className="rounded-3xl border border-[#ebe6f4] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-2xl bg-[#f6f2ff] p-3 text-[#8f63d9]">
          <FilePlus2 size={20} />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-[#2f3042]">Crear nuevo pedido</h3>
          <p className="text-sm text-[#5f6074]">
            Elegí los productos del tratamiento y definí la cadencia en días para cada uno.
          </p>
        </div>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={formik.handleSubmit}>
        <label className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2f3042]">
            Inicio del ciclo
            <InfoTooltip label="Es la fecha en la que arranca el seguimiento de este pedido. A partir de acá calculamos cuándo te vamos a contactar y cuándo debería llegarte la próxima entrega." />
          </span>
          <input
            type="date"
            name="fechaInicioCicloBase"
            className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
            value={formik.values.fechaInicioCicloBase}
            onChange={formik.handleChange}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2f3042]">
            Fecha objetivo de entrega
            <InfoTooltip label="Es el día en que te gustaría recibir este pedido. La usamos para coordinar el despacho y para calcular cuándo te vamos a contactar antes de la entrega." />
          </span>
          <input
            type="date"
            name="fechaObjetivoEntrega"
            required
            className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
            value={formik.values.fechaObjetivoEntrega}
            onChange={formik.handleChange}
          />
          {formik.errors.fechaObjetivoEntrega ? (
            <span className="text-xs font-medium text-[#b03c55]">
              {formik.errors.fechaObjetivoEntrega}
            </span>
          ) : null}
        </label>

        {fechaContactoEstimada ? (
          <div className="md:col-span-2 rounded-2xl border border-[#e2daf3] bg-[#faf7ff] px-4 py-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8f7fa0]">
              <Clock size={14} />
              Fecha estimada del contacto
              <InfoTooltip label={`Te contactamos ${DEFAULT_ANTICIPACION_DIAS} días antes de la fecha objetivo de entrega, para tener tiempo de confirmar los datos y coordinar el despacho.`} />
            </p>
            <p className="mt-1 text-base font-semibold text-[#8f63d9]">
              {formatPortalProfileDate(fechaContactoEstimada)}
            </p>
          </div>
        ) : null}

        <ProductSearchField
          key={productSearchResetKey}
          selectedProducts={formik.values.items}
          error={itemsError}
          onAdd={(product) => {
            formik.setFieldTouched("items", true, false);
            if (formik.values.items.some((item) => item.id === product.id)) {
              return;
            }
            formik.setFieldValue("items", [
              ...formik.values.items,
              { ...product, periodoDias: "30" },
            ]);
          }}
          onRemove={(productId) => {
            formik.setFieldValue(
              "items",
              formik.values.items.filter((item) => item.id !== productId),
            );
          }}
          onPeriodChange={(productId, value) => {
            formik.setFieldValue(
              "items",
              formik.values.items.map((item) =>
                item.id === productId ? { ...item, periodoDias: value } : item,
              ),
            );
          }}
        />

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={formik.isSubmitting || !hasVerifiedContact}
            className="inline-flex items-center justify-center rounded-2xl bg-[#8f63d9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f56c7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {formik.isSubmitting ? "Creando pedido..." : "Crear pedido"}
          </button>
        </div>
      </form>
    </article>
  );
}
