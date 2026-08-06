"use client";

import type { FormikProps } from "formik";
import type { PortalPerfilDomicilio } from "@/types/portal-profile";
import type { PortalSucursalOption } from "@/types/portal-sucursales";
import { getDomicilioLabel } from "../../../../helpers/expedientes-management.helpers";
import type { CreateFormValues } from "./CrearPedidoView";

interface CrearPedidoStep3ConfirmacionProps {
  formik: FormikProps<CreateFormValues>;
  domicilios: PortalPerfilDomicilio[];
  selectedSucursal: PortalSucursalOption | null;
  onBack: () => void;
}

export function CrearPedidoStep3Confirmacion({
  formik,
  domicilios,
  selectedSucursal,
  onBack,
}: CrearPedidoStep3ConfirmacionProps) {
  const domicilioElegido = domicilios.find(
    (domicilio) => domicilio.id === formik.values.domicilioEntregaId,
  );

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      <p className="text-sm text-[#5f6074]">Revisá los datos de tu pedido antes de confirmar.</p>

      <div className="grid gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f63d9]">
            Productos ({formik.values.items.length})
          </p>
          <div className="grid gap-2">
            {formik.values.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#e2daf3] bg-[#faf7ff] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[#2f3042]">{item.nombre}</p>
                  <p className="text-xs text-[#6f7085]">{item.laboratorio}</p>
                </div>
                <span className="text-xs font-medium text-[#8f63d9]">
                  Cada {item.periodoDias} días
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#ebe6f4] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7fa0]">
            Entrega
          </p>
          {formik.values.medioEntrega === "ENVIO_DOMICILIO" ? (
            <p className="mt-1 text-sm font-semibold text-[#2f3042]">
              Envío a domicilio
              {domicilioElegido ? ` — ${getDomicilioLabel(domicilioElegido)}` : ""}
            </p>
          ) : (
            <p className="mt-1 text-sm font-semibold text-[#2f3042]">
              Retiro en sucursal
              {selectedSucursal ? ` — ${selectedSucursal.nombre}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={formik.isSubmitting}
          className="inline-flex items-center justify-center rounded-2xl border border-[#ddd6eb] px-5 py-3 text-sm font-semibold text-[#2f3042] transition hover:border-[#c4b5e0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={formik.isSubmitting}
          className="inline-flex items-center justify-center rounded-2xl bg-[#8f63d9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f56c7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {formik.isSubmitting ? "Creando pedido..." : "Confirmar pedido"}
        </button>
      </div>
    </form>
  );
}