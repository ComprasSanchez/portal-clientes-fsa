"use client";

import type { FormikProps } from "formik";
import { Calendar, CalendarDays, Clock, Info } from "lucide-react";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "@heroui/react";
import { PortalDatePicker } from "@/components/molecules/expedientes/PortalDatePicker";
import { SucursalPickerField } from "@/components/molecules/expedientes/SucursalPickerField";
import { formatPortalProfileDate } from "@/lib/portal-profile";
import type { PortalPerfilDomicilio } from "@/types/portal-profile";
import type { PortalSucursalOption } from "@/types/portal-sucursales";
import {
  DEFAULT_ANTICIPACION_DIAS,
  DELIVERY_OPTIONS,
  getDomicilioLabel,
  getDomicilioValue,
  subtractDaysFromIsoDate,
} from "../../../../helpers/expedientes-management.helpers";
import type { CreateFormValues } from "./CrearPedidoView";

interface InfoTooltipProps {
  label: string;
}

const InfoTooltip = ({ label }: InfoTooltipProps) => (
  <TooltipRoot delay={150}>
    <TooltipTrigger className="inline-flex items-center rounded-full p-0 align-middle text-[#8f7fa0] hover:text-[#8f63d9]">
      <Info size={14} />
    </TooltipTrigger>
    <TooltipContent showArrow className="max-w-[290px] text-[15px] leading-snug text-[#2f3042]">
      {label}
    </TooltipContent>
  </TooltipRoot>
);

const STEP2_FIELDS = [
  "fechaObjetivoEntrega",
  "medioEntrega",
  "domicilioEntregaId",
  "sucursalEntregaId",
] as const;

interface CrearPedidoStep2EntregaProps {
  formik: FormikProps<CreateFormValues>;
  domicilios: PortalPerfilDomicilio[];
  selectedSucursal: PortalSucursalOption | null;
  onSelectSucursal: (sucursal: PortalSucursalOption | null) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function CrearPedidoStep2Entrega({
  formik,
  domicilios,
  selectedSucursal,
  onSelectSucursal,
  onBack,
  onContinue,
}: CrearPedidoStep2EntregaProps) {
  const fechaContactoEstimada = formik.values.fechaObjetivoEntrega
    ? subtractDaysFromIsoDate(
        formik.values.fechaObjetivoEntrega,
        DEFAULT_ANTICIPACION_DIAS,
      )
    : null;

  const handleMedioEntregaChange = (value: string) => {
    formik.setValues({
      ...formik.values,
      medioEntrega: value,
      domicilioEntregaId: value === "ENVIO_DOMICILIO" ? formik.values.domicilioEntregaId : "",
      sucursalEntregaId: value === "RETIRA_SUCURSAL" ? formik.values.sucursalEntregaId : "",
    });
  };

  const handleContinue = async () => {
    const touched = Object.fromEntries(STEP2_FIELDS.map((field) => [field, true]));
    formik.setTouched({ ...formik.touched, ...touched }, false);
    const errors = await formik.validateForm();
    const hasStepError = STEP2_FIELDS.some(
      (field) => Boolean((errors as Record<string, unknown>)[field]),
    );
    if (!hasStepError) {
      onContinue();
    }
  };

  const showError = (field: (typeof STEP2_FIELDS)[number]) =>
    formik.touched[field] && formik.errors[field] ? (
      <p className="text-xs font-medium text-[#b03c55]">{formik.errors[field] as string}</p>
    ) : null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#5f6074]">
        Decinos cuándo lo necesitás y cómo preferís recibirlo.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2f3042]">
            Inicio del ciclo
            <InfoTooltip label="Es la fecha en la que arranca el seguimiento de este pedido. A partir de acá calculamos cuándo te vamos a contactar y cuándo debería llegarte la próxima entrega." />
          </div>
          <PortalDatePicker
            value={formik.values.fechaInicioCicloBase}
            onChange={(value) => formik.setFieldValue("fechaInicioCicloBase", value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2f3042]">
            Fecha objetivo de entrega
            <InfoTooltip label="Es el día en que te gustaría recibir este pedido. La usamos para coordinar el despacho y para calcular cuándo te vamos a contactar antes de la entrega." />
          </div>
          <PortalDatePicker
            value={formik.values.fechaObjetivoEntrega}
            onChange={(value) => formik.setFieldValue("fechaObjetivoEntrega", value)}
            onBlur={() => formik.setFieldTouched("fechaObjetivoEntrega", true)}
            disableBeforeToday
          />
          {showError("fechaObjetivoEntrega")}
        </div>

        {fechaContactoEstimada ? (
          <div className="md:col-span-2 rounded-2xl border border-[#e2daf3] bg-[#faf7ff] px-4 py-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8f7fa0]">
              <CalendarDays size={14} />
              Fecha estimada del contacto
              <InfoTooltip
                label={`Te contactamos ${DEFAULT_ANTICIPACION_DIAS} días antes de la fecha objetivo de entrega, para tener tiempo de confirmar los datos y coordinar el despacho.`}
              />
            </div>
            <p className="mt-1 text-base font-semibold text-[#8f63d9]">
              {formatPortalProfileDate(fechaContactoEstimada)}
            </p>
          </div>
        ) : null}

        <div className="md:col-span-2">
          <span className="text-sm font-medium text-[#2f3042]">
            ¿Cómo querés recibir tu pedido?
          </span>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            {DELIVERY_OPTIONS.filter((option) => option.value).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleMedioEntregaChange(option.value)}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  formik.values.medioEntrega === option.value
                    ? "border-[#8f63d9] bg-[#8f63d9] text-white"
                    : "border-[#ddd6eb] bg-white text-[#2f3042] hover:border-[#c4b5e0]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {showError("medioEntrega")}
        </div>

        {formik.values.medioEntrega === "ENVIO_DOMICILIO" ? (
          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="text-sm font-medium text-[#2f3042]">Domicilio de entrega</span>
            <select
              name="domicilioEntregaId"
              className="rounded-2xl border border-[#ddd6eb] px-4 py-3 text-sm outline-none transition focus:border-[#8f63d9]"
              value={formik.values.domicilioEntregaId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <option value="">Seleccioná un domicilio</option>
              {domicilios.map((domicilio) => (
                <option key={getDomicilioValue(domicilio)} value={domicilio.id ?? ""}>
                  {getDomicilioLabel(domicilio)}
                </option>
              ))}
            </select>
            {showError("domicilioEntregaId")}
          </label>
        ) : null}

        {formik.values.medioEntrega === "RETIRA_SUCURSAL" ? (
          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="text-sm font-medium text-[#2f3042]">Sucursal de retiro</span>
            <SucursalPickerField
              value={formik.values.sucursalEntregaId}
              initialSucursal={selectedSucursal}
              onChange={(sucursalId, sucursal) => {
                formik.setFieldValue("sucursalEntregaId", sucursalId);
                onSelectSucursal(sucursal);
              }}
            />
            {showError("sucursalEntregaId")}
          </label>
        ) : null}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-2xl border border-[#ddd6eb] px-5 py-3 text-sm font-semibold text-[#2f3042] transition hover:border-[#c4b5e0]"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={() => void handleContinue()}
          className="inline-flex items-center justify-center rounded-2xl bg-[#8f63d9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f56c7]"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}