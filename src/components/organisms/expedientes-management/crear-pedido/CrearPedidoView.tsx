"use client";

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import PortalStepper from "@/components/molecules/stepper/stepper";
import { prefetchSucursales } from "@/components/molecules/expedientes/SucursalPickerField";
import { useGlobalToast } from "@/components/ui/global-toast";
import { usePortalExpedienteActual } from "@/lib/use-portal-expediente-actual";
import { usePreferredPortalProfile } from "@/lib/use-preferred-portal-profile";
import { formatPortalProfileDate } from "@/lib/portal-profile";
import type { PortalPerfilResponse } from "@/types/portal-profile";
import type { PortalExpedientesResponse } from "@/types/portal-expedientes";
import type {
  CreatedExpedienteSummary,
  PortalCreateExpedienteRequest,
  PortalCreateExpedienteResponse,
} from "@/types/portal-expediente-mutations";
import type { SelectedProductState } from "@/types/portal-productos";
import type { PortalSucursalOption } from "@/types/portal-sucursales";
import type { HomeView } from "@/types/home";
import {
  DEFAULT_ANTICIPACION_DIAS,
  formatExpedienteLabel,
  getAutoTitulo,
  todayIso,
} from "../../../../helpers/expedientes-management.helpers";
import { CrearPedidoStep1Productos } from "./CrearPedidoStep1Productos";
import { CrearPedidoStep2Entrega } from "./CrearPedidoStep2Entrega";
import { CrearPedidoStep3Confirmacion } from "./CrearPedidoStep3Confirmacion";

export interface CreateFormValues {
  fechaInicioCicloBase: string;
  fechaObjetivoEntrega: string;
  medioEntrega: string;
  domicilioEntregaId: string;
  sucursalEntregaId: string;
  items: SelectedProductState[];
}

const buildInitialValues = (domicilioEntregaId = ""): CreateFormValues => ({
  fechaInicioCicloBase: todayIso(),
  fechaObjetivoEntrega: "",
  medioEntrega: "",
  domicilioEntregaId,
  sucursalEntregaId: "",
  items: [],
});

const createSchema = Yup.object({
  fechaInicioCicloBase: Yup.string().required(
    "Ingresá la fecha de inicio del ciclo.",
  ),
  fechaObjetivoEntrega: Yup.string()
    .required("Ingresá la fecha objetivo de entrega.")
    .test(
      "not-in-past",
      "La fecha objetivo de entrega no puede ser anterior a hoy.",
      (value) => !value || value >= todayIso(),
    ),
  medioEntrega: Yup.string().required("Elegí cómo querés recibir tu pedido."),
  domicilioEntregaId: Yup.string().when("medioEntrega", {
    is: "ENVIO_DOMICILIO",
    then: (schema) =>
      schema.required("Seleccioná un domicilio para la entrega."),
  }),
  sucursalEntregaId: Yup.string().when("medioEntrega", {
    is: "RETIRA_SUCURSAL",
    then: (schema) =>
      schema.required("Seleccioná una sucursal para el retiro."),
  }),
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

interface CrearPedidoViewProps {
  perfil: PortalPerfilResponse | null;
  refreshExpedientes: () => Promise<PortalExpedientesResponse | null>;
  onNavigate: (view: HomeView) => void;
  previousView: HomeView;
}

export function CrearPedidoView({
  perfil,
  refreshExpedientes,
  onNavigate,
  previousView,
}: CrearPedidoViewProps) {
  const { pushToast } = useGlobalToast();
  const { refresh: refreshExpedienteActual } = usePortalExpedienteActual({
    enabled: true,
  });
  const {
    domicilios,
    hasVerifiedContact,
    preferredVerifiedContact,
    preferredAfiliacionId,
    preferredDomicilioId,
  } = usePreferredPortalProfile(perfil);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [productosSubpaso, setProductosSubpaso] = useState<
    "productos" | "frecuencia"
  >("productos");
  const [productSearchResetKey, setProductSearchResetKey] = useState(0);
  const [selectedSucursal, setSelectedSucursal] =
    useState<PortalSucursalOption | null>(null);
  const [createdSummary, setCreatedSummary] =
    useState<CreatedExpedienteSummary | null>(null);

  useEffect(() => {
    prefetchSucursales();
  }, []);

  const formik = useFormik<CreateFormValues>({
    initialValues: buildInitialValues(preferredDomicilioId),
    validationSchema: createSchema,
    onSubmit: async (values, helpers) => {
      if (!hasVerifiedContact) {
        pushToast({
          title: "No pudimos crear el pedido",
          description:
            "Necesitás un contacto verificado antes de crear un pedido.",
          variant: "error",
        });
        return;
      }

      const payload: PortalCreateExpedienteRequest = {
        titulo: getAutoTitulo(values.items),
        contactoId: preferredVerifiedContact?.id ?? null,
        afiliacionOSId: preferredAfiliacionId || null,
        anticipacionDias: DEFAULT_ANTICIPACION_DIAS,
        medioEntrega: values.medioEntrega || null,
        domicilioEntregaId:
          values.medioEntrega === "ENVIO_DOMICILIO"
            ? values.domicilioEntregaId || null
            : null,
        sucursalEntregaId:
          values.medioEntrega === "RETIRA_SUCURSAL" && values.sucursalEntregaId
            ? Number(values.sucursalEntregaId)
            : null,
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

        const data = (response.headers.get("content-type") || "").includes(
          "application/json",
        )
          ? ((await response.json().catch(() => null)) as
              | PortalCreateExpedienteResponse
              | { error?: string; message?: string }
              | null)
          : null;

        if (!response.ok) {
          const message =
            (data &&
              "message" in data &&
              typeof data.message === "string" &&
              data.message) ||
            (data &&
              "error" in data &&
              typeof data.error === "string" &&
              data.error) ||
            "No pudimos crear el pedido.";
          throw new Error(message);
        }

        const createResult =
          data && "expedienteId" in data
            ? (data as PortalCreateExpedienteResponse)
            : null;

        pushToast({
          title: "Pedido creado",
          description:
            "La solicitud se envió correctamente. Vamos a refrescar tus pedidos.",
          variant: "success",
        });

        const [expedientesData] = await Promise.all([
          refreshExpedientes(),
          refreshExpedienteActual(),
        ]);

        const createdExpediente =
          expedientesData?.data.items.find(
            (item) => item.expedienteId === createResult?.expedienteId,
          ) ?? null;

        setCreatedSummary({
          expedienteId: createResult?.expedienteId ?? "",
          fechaObjetivoEntrega:
            createdExpediente?.cicloActual?.fechaEntregaObjetivo ??
            payload.proximaFechaEntregaForzada ??
            null,
          fechaPrimerContacto:
            createdExpediente?.cicloActual?.fechaInicioGestion ?? null,
        });

        helpers.resetForm({ values: buildInitialValues(preferredDomicilioId) });
        setProductSearchResetKey((current) => current + 1);
        setSelectedSucursal(null);
        setProductosSubpaso("productos");
        setStep(1);
      } catch (error) {
        pushToast({
          title: "No pudimos crear el pedido",
          description:
            error instanceof Error
              ? error.message
              : "Ocurrió un error inesperado.",
          variant: "error",
        });
      }
    },
  });

  if (createdSummary) {
    return (
      <article className="rounded-3xl border border-[#dcd0f4] bg-[#faf7ff] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8f63d9]">
          Alta confirmada
        </p>
        <h3 className="mt-2 text-xl font-semibold text-[#2f3042]">
          Tu pedido ya fue creado
        </h3>
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
        <button
          type="button"
          onClick={() => onNavigate("mi-historial")}
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#8f63d9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f56c7]"
        >
          Volver a Mi historial
        </button>
      </article>
    );
  }

  const stepTitles: Record<1 | 2 | 3, string> = {
    1: "Preparación de pedido",
    2: "Coordinemos la entrega",
    3: "Ya casi terminamos",
  };

  return (
    <section className="space-y-4">
      <h2 className="text-center text-[26px] font-bold uppercase m-0 text-[#8f63d9] sm:text-left sm:text-[36px]">
        {stepTitles[step]}
      </h2>

      <PortalStepper currentStep={step} />

      {step === 1 ? (
        <CrearPedidoStep1Productos
          formik={formik}
          productSearchResetKey={productSearchResetKey}
          onContinue={() => setStep(2)}
          perfil={perfil}
          subpaso={productosSubpaso}
          onSubpasoChange={setProductosSubpaso}
          onExit={() => onNavigate(previousView)}
        />
      ) : null}

      {step === 2 ? (
        <CrearPedidoStep2Entrega
          formik={formik}
          domicilios={domicilios}
          selectedSucursal={selectedSucursal}
          onSelectSucursal={setSelectedSucursal}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
        />
      ) : null}

      {step === 3 ? (
        <CrearPedidoStep3Confirmacion
          formik={formik}
          domicilios={domicilios}
          selectedSucursal={selectedSucursal}
          onBack={() => setStep(2)}
        />
      ) : null}
    </section>
  );
}
