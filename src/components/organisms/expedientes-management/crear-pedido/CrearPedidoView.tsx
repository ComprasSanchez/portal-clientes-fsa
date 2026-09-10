"use client";

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CheckCircle2, FileText, Pill } from "lucide-react";
import { prefetchSucursales } from "@/components/molecules/expedientes/SucursalPickerField";
import { RecetaDropzone } from "@/components/molecules/receta-dropzone/receta-dropzone";
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
  formatExpedienteLabel,
  getAutoTitulo,
  getDomicilioLabel,
  todayIso,
} from "../../../../helpers/expedientes-management.helpers";
import { CrearPedidoStep1Productos } from "./CrearPedidoStep1Productos";
import { CrearPedidoStep2Entrega } from "./CrearPedidoStep2Entrega";

export interface CreateFormValues {
  fechaInicioCicloBase: string;
  fechaContactoDeseada: string;
  medioEntrega: string;
  domicilioEntregaId: string;
  sucursalEntregaId: string;
  items: SelectedProductState[];
}

const buildInitialValues = (domicilioEntregaId = ""): CreateFormValues => ({
  fechaInicioCicloBase: todayIso(),
  fechaContactoDeseada: "",
  medioEntrega: "",
  domicilioEntregaId,
  sucursalEntregaId: "",
  items: [],
});

const createSchema = Yup.object({
  fechaInicioCicloBase: Yup.string().required(
    "Ingresá la fecha de inicio del ciclo.",
  ),
  fechaContactoDeseada: Yup.string()
    .required("Ingresá el día en que querés que te contactemos.")
    .test(
      "not-in-past",
      "El día de contacto no puede ser anterior a hoy.",
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
  items: Yup.array().of(
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
  ),
});

interface CrearPedidoViewProps {
  perfil: PortalPerfilResponse | null;
  refreshExpedientes: () => Promise<PortalExpedientesResponse | null>;
  onNavigate: (view: HomeView) => void;
  previousView: HomeView;
}

type SectionProps = {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
};

function Section({ number, title, description, children }: SectionProps) {
  return (
    <div className="rounded-3xl border border-[#e2daf3] bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8f63d9] text-sm font-bold text-white">
          {number}
        </span>
        <div>
          <p className="text-base font-semibold text-[#2f3042]">{title}</p>
          <p className="text-sm text-[#6f7085]">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function CrearPedidoView({
  perfil,
  refreshExpedientes,
  onNavigate,
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

  const [productosSubpaso, setProductosSubpaso] = useState<
    "productos" | "frecuencia"
  >("productos");
  const [productSearchResetKey, setProductSearchResetKey] = useState(0);
  const [selectedSucursal, setSelectedSucursal] =
    useState<PortalSucursalOption | null>(null);
  const [createdSummary, setCreatedSummary] =
    useState<CreatedExpedienteSummary | null>(null);

  const [recetaFile, setRecetaFile] = useState<File | null>(null);
  const [recetaOmitida, setRecetaOmitida] = useState(false);
  const [recetaPanelOpen, setRecetaPanelOpen] = useState(true);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [submitBlockedMessage, setSubmitBlockedMessage] = useState<
    string | null
  >(null);

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

      if (!recetaFile && values.items.length === 0) {
        setSubmitBlockedMessage(
          "Subí tu receta o elegí al menos un producto para poder confirmar el pedido.",
        );
        return;
      }
      setSubmitBlockedMessage(null);

      const payload: PortalCreateExpedienteRequest = {
        titulo: getAutoTitulo(values.items),
        contactoId: preferredVerifiedContact?.id ?? null,
        afiliacionOSId: preferredAfiliacionId || null,
        anticipacionDias: 0,
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
        proximaFechaEntregaForzada: values.fechaContactoDeseada || null,
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

        const [expedientesData] = await Promise.all([
          refreshExpedientes(),
          refreshExpedienteActual(),
        ]);

        const clienteId = expedientesData?.data.clienteId ?? "";
        let recetaUploadFailed = false;

        if (recetaFile && createResult?.expedienteId && clienteId) {
          try {
            const recetaFormData = new FormData();
            recetaFormData.append("file", recetaFile);
            recetaFormData.append("clienteId", clienteId);

            const recetaResponse = await fetch(
              `/api/portal/me/expedientes/${createResult.expedienteId}/recetas`,
              { method: "POST", body: recetaFormData },
            );

            recetaUploadFailed = !recetaResponse.ok;
          } catch {
            recetaUploadFailed = true;
          }
        } else if (recetaFile) {
          recetaUploadFailed = true;
        }

        pushToast({
          title: "Pedido creado",
          description:
            "La solicitud se envió correctamente. Vamos a refrescar tus pedidos.",
          variant: "success",
        });

        const createdExpediente =
          expedientesData?.data.items.find(
            (item) => item.expedienteId === createResult?.expedienteId,
          ) ?? null;

        setCreatedSummary({
          expedienteId: createResult?.expedienteId ?? "",
          clienteId,
          fechaContacto:
            createdExpediente?.cicloActual?.fechaInicioGestion ??
            payload.proximaFechaEntregaForzada ??
            null,
          recetaUploadFailed,
        });

        helpers.resetForm({ values: buildInitialValues(preferredDomicilioId) });
        setProductSearchResetKey((current) => current + 1);
        setSelectedSucursal(null);
        setProductosSubpaso("productos");
        setRecetaFile(null);
        setRecetaOmitida(false);
        setRecetaPanelOpen(true);
        setShowProductPicker(false);
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
        <div className="mt-4 grid gap-3 md:grid-cols-2">
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
              Fecha de contacto
            </p>
            <p className="mt-1 text-sm font-semibold text-[#2f3042]">
              {createdSummary.fechaContacto
                ? formatPortalProfileDate(createdSummary.fechaContacto)
                : "Te vamos a confirmar pronto la fecha de contacto"}
            </p>
          </div>
        </div>

        {createdSummary.recetaUploadFailed && (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No pudimos subir tu receta. Podés reintentar más adelante desde
            &quot;Mi historial&quot; o mandarla por WhatsApp.
          </div>
        )}

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

  const domicilioElegido = domicilios.find(
    (domicilio) => domicilio.id === formik.values.domicilioEntregaId,
  );
  const canSubmit =
    Boolean(recetaFile) || formik.values.items.length > 0;

  return (
    <section className="space-y-4">
      <div className="text-center sm:text-left">
        <h2 className="text-[26px] font-bold uppercase text-[#8f63d9] sm:text-[36px]">
          Armemos tu pedido
        </h2>
        <p className="text-sm text-[#6f7085]">
          Contame qué necesitás y yo me ocupo del resto.
        </p>
      </div>

      <Section
        number={1}
        title="Cargá tu receta o agregá productos"
        description="Subí una foto o PDF de tu receta, elegí los productos manualmente, o ambos."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRecetaPanelOpen((open) => !open)}
            className={`inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              recetaPanelOpen
                ? "border-[#8f63d9] bg-[#8f63d9] text-white"
                : "border-[#ddd6eb] bg-white text-[#2f3042] hover:border-[#c4b5e0]"
            }`}
          >
            <FileText size={16} />
            {recetaFile
              ? "Receta adjuntada"
              : recetaOmitida
                ? "Receta pendiente"
                : "Subir receta"}
          </button>
          <button
            type="button"
            onClick={() => setShowProductPicker((open) => !open)}
            className={`inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              showProductPicker
                ? "border-[#8f63d9] bg-[#8f63d9] text-white"
                : "border-[#ddd6eb] bg-white text-[#2f3042] hover:border-[#c4b5e0]"
            }`}
          >
            <Pill size={16} />
            {formik.values.items.length > 0
              ? `Productos (${formik.values.items.length})`
              : "Agregar productos"}
          </button>
        </div>

        {recetaPanelOpen && (
          <div className="space-y-2">
            {!recetaFile && !recetaOmitida && (
              <>
                <RecetaDropzone
                  file={recetaFile}
                  onSelect={setRecetaFile}
                  onRemove={() => setRecetaFile(null)}
                />
                <button
                  type="button"
                  onClick={() => setRecetaOmitida(true)}
                  className="text-sm font-semibold text-[#8f63d9] hover:underline"
                >
                  No la tengo a mano ahora
                </button>
              </>
            )}

            {recetaFile && (
              <RecetaDropzone
                file={recetaFile}
                onSelect={setRecetaFile}
                onRemove={() => setRecetaFile(null)}
              />
            )}

            {recetaOmitida && !recetaFile && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRecetaOmitida(false)}
                  className="text-sm font-semibold text-[#8f63d9] hover:underline"
                >
                  Adjuntar receta
                </button>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  Pendiente — te la pedimos por WhatsApp antes de coordinar la
                  entrega
                </span>
              </div>
            )}
          </div>
        )}

        {showProductPicker && (
          <div className={recetaPanelOpen ? "mt-4 border-t border-[#f0e9fb] pt-4" : ""}>
            <CrearPedidoStep1Productos
              formik={formik}
              productSearchResetKey={productSearchResetKey}
              onContinue={() => setShowProductPicker(false)}
              perfil={perfil}
              subpaso={productosSubpaso}
              onSubpasoChange={setProductosSubpaso}
              onExit={() => setShowProductPicker(false)}
            />
          </div>
        )}
      </Section>

      <Section
        number={2}
        title="Confirmá tus datos de contacto"
        description="Mantené tu teléfono o mail actualizados para que podamos avisarte."
      >
        {hasVerifiedContact ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={14} />
            Verificado
          </span>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-[#6f7085]">
              Todavía no tenés un contacto verificado.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("mi-cuenta")}
              className="rounded-2xl bg-[#8f63d9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7f56c7]"
            >
              Verificar en Mi cuenta
            </button>
          </div>
        )}
      </Section>

      <Section
        number={3}
        title="Elegí cuándo te contactamos y dónde lo recibís"
        description="Coordinamos la entrega en esa llamada."
      >
        <CrearPedidoStep2Entrega
          formik={formik}
          domicilios={domicilios}
          selectedSucursal={selectedSucursal}
          onSelectSucursal={setSelectedSucursal}
          hideInicioCiclo
        />
      </Section>

      <Section
        number={4}
        title="¿Qué pasa después?"
        description="Cuando confirmes, te contactamos para coordinar la entrega."
      >
        <p className="text-sm text-[#6f7085]">
          Un asesor va a revisar tu receta y tus productos, y te va a
          contactar para coordinar todo antes de la entrega.
        </p>
      </Section>

      {formik.values.medioEntrega && (
        <div className="rounded-2xl border border-[#ebe6f4] px-4 py-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7fa0]">
            Resumen de entrega
          </p>
          <p className="mt-1 font-semibold text-[#2f3042]">
            {formik.values.medioEntrega === "ENVIO_DOMICILIO"
              ? `Envío a domicilio${
                  domicilioElegido ? ` — ${getDomicilioLabel(domicilioElegido)}` : ""
                }`
              : `Retiro en sucursal${
                  selectedSucursal ? ` — ${selectedSucursal.nombre}` : ""
                }`}
          </p>
        </div>
      )}

      {submitBlockedMessage && (
        <p className="text-sm font-medium text-[#b03c55]">
          {submitBlockedMessage}
        </p>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => void formik.handleSubmit()}
          disabled={formik.isSubmitting || !canSubmit}
          className="w-full rounded-2xl bg-[#8f63d9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f56c7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {formik.isSubmitting ? "Creando pedido..." : "Confirmar pedido"}
        </button>

        {process.env.NEXT_PUBLIC_FSA_PHONE_PORTAL && (
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_FSA_PHONE_PORTAL}?text=${encodeURIComponent(
              "Hola, estoy armando mi pedido y necesito ayuda.",
            )}`}
            className="block text-center text-sm font-semibold text-[#8f63d9] hover:underline"
          >
            ¿Preferís que te ayude un asesor con este pedido?
          </a>
        )}
      </div>
    </section>
  );
}
