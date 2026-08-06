"use client";

import { useEffect, useState } from "react";
import type { FormikProps } from "formik";
import { History } from "lucide-react";
import { ProductSearchField } from "@/components/molecules/expedientes/ProductSearchField";
import type { PortalProductoRecurrente } from "@/types/portal-productos";
import type { CreateFormValues } from "./CrearPedidoView";

const CADENCIA_DEFAULT = "30";
const CADENCIA_OPTIONS = [15, 30, 45, 60, 90];

interface CrearPedidoStep1ProductosProps {
  formik: FormikProps<CreateFormValues>;
  productSearchResetKey: number;
  onContinue: () => void;
  perfil: {
    nombre?: string | null;
  } | null;
  subpaso: "productos" | "frecuencia";
  onSubpasoChange: (subpaso: "productos" | "frecuencia") => void;
  onExit: () => void;
}

export function CrearPedidoStep1Productos({
  formik,
  productSearchResetKey,
  onContinue,
  perfil,
  subpaso,
  onSubpasoChange,
  onExit,
}: CrearPedidoStep1ProductosProps) {
  const [recurrentes, setRecurrentes] = useState<PortalProductoRecurrente[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/portal/me/productos-recurrentes", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { data?: PortalProductoRecurrente[] } | null) => {
        if (!cancelled && Array.isArray(data?.data)) {
          setRecurrentes(data.data);
        }
      })
      .catch(() => {
        if (!cancelled) setRecurrentes([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const habituales = recurrentes.filter(
    (producto) => !formik.values.items.some((item) => item.id === producto.id),
  );

  const itemsError =
    typeof formik.errors.items === "string"
      ? formik.errors.items
      : Array.isArray(formik.errors.items) && formik.touched.items
        ? "Cada producto debe tener una cadencia válida en días."
        : undefined;

  const validateItems = async () => {
    formik.setFieldTouched("items", true, false);
    const errors = await formik.validateForm();
    return !errors.items;
  };

  const handleContinueProductos = async () => {
    if (await validateItems()) {
      onSubpasoChange("frecuencia");
    }
  };

  const handleContinueFrecuencia = async () => {
    if (await validateItems()) {
      onContinue();
    }
  };

  const handleBackToProductos = () => onSubpasoChange("productos");

  const handleApplyToAll = (value: string) => {
    formik.setFieldValue(
      "items",
      formik.values.items.map((item) => ({ ...item, periodoDias: value })),
    );
  };

  const handlePeriodChange = (productId: string, value: string) => {
    formik.setFieldValue(
      "items",
      formik.values.items.map((item) =>
        item.id === productId ? { ...item, periodoDias: value } : item,
      ),
    );
  };

  const handleAddHabitual = (producto: PortalProductoRecurrente) => {
    formik.setFieldTouched("items", true, false);
    formik.setFieldValue("items", [
      ...formik.values.items,
      {
        id: producto.id,
        nombre: producto.nombre,
        laboratorio: "",
        periodoDias: CADENCIA_DEFAULT,
      },
    ]);
  };

  if (subpaso === "frecuencia") {
    return (
      <div className="space-y-6">
        <div className="sm:rounded-2xl sm:border sm:border-[#e2daf3] sm:bg-[#faf7ff] sm:p-4">
          <p className="text-sm font-medium text-[#2f3042]">
            Frecuencia por producto
          </p>
          <p className="mt-1 text-xs text-[#6f7085]">
            Elegí cada cuántos días necesitás cada producto. Podés aplicar el
            mismo valor al resto con &quot;Aplicar a todos&quot;.
          </p>
          <div className="mt-3 grid gap-3">
            {formik.values.items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#e9e1f6] bg-white p-3"
              >
                <p className="text-sm font-semibold text-[#2f3042]">
                  {item.nombre}
                </p>
                <div className="mt-2">
                  <span className="text-xs font-medium text-[#2f3042]">
                    Cada
                  </span>

                  <select
                    value={
                      CADENCIA_OPTIONS.includes(Number(item.periodoDias))
                        ? item.periodoDias
                        : ""
                    }
                    onChange={(event) =>
                      handlePeriodChange(item.id, event.target.value)
                    }
                    className="mt-1 block w-full rounded-xl border border-[#ddd6eb] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#8f63d9] sm:hidden"
                  >
                    <option value="" disabled>
                      Elegí una frecuencia
                    </option>
                    {CADENCIA_OPTIONS.map((days) => (
                      <option key={days} value={days}>
                        {days} días
                      </option>
                    ))}
                  </select>

                  <div className="mt-1 hidden flex-wrap items-center gap-2 sm:flex">
                    {CADENCIA_OPTIONS.map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() =>
                          handlePeriodChange(item.id, String(days))
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          item.periodoDias === String(days)
                            ? "border-[#8f63d9] bg-[#8f63d9] text-white"
                            : "border-[#ddd6eb] bg-white text-[#2f3042] hover:border-[#c4b5e0]"
                        }`}
                      >
                        {days} días
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-[#f0e9fb] pt-3">
                  <span className="text-xs text-[#6f7085]">
                    O un valor personalizado:
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={item.periodoDias}
                    onChange={(event) =>
                      handlePeriodChange(item.id, event.target.value)
                    }
                    className="w-16 rounded-xl border border-[#ddd6eb] px-2 py-1.5 text-xs outline-none transition focus:border-[#8f63d9]"
                  />
                  <span className="text-xs font-medium text-[#2f3042]">
                    días
                  </span>
                </div>

                {formik.values.items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => handleApplyToAll(item.periodoDias)}
                    className="mt-3 w-full rounded-xl border border-[#d8ccef] px-3 py-2 text-xs font-semibold text-[#6c48b4] transition hover:bg-[#f7f2ff] sm:w-auto"
                  >
                    Aplicar a todos
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {itemsError ? (
          <p className="text-sm font-medium text-[#b03c55]">{itemsError}</p>
        ) : null}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleBackToProductos}
            className="inline-flex items-center justify-center rounded-2xl border border-[#ddd6eb] px-5 py-3 text-sm font-semibold text-[#2f3042] transition hover:border-[#c4b5e0]"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={() => void handleContinueFrecuencia()}
            className="inline-flex items-center justify-center rounded-2xl bg-[#8f63d9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f56c7]"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {habituales.length > 0 ? (
        <div className="sm:rounded-2xl sm:border sm:border-[#e2daf3] sm:bg-[#faf7ff] sm:p-4">
          <div className="mb-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f63d9]">
              <History size={14} />
              ¡Hola{perfil?.nombre ? ` ${perfil.nombre}` : ""}!
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f63d9]">
              Estos son los productos que usás habitualmente:
            </p>
          </div>
          <div className="grid gap-3">
            {habituales.map((producto) => (
              <div
                key={producto.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#e9e1f6] bg-white p-4"
              >
                <p className="font-semibold text-[#2f3042]">
                  {producto.nombre}
                </p>
                <button
                  type="button"
                  onClick={() => handleAddHabitual(producto)}
                  className="rounded-xl bg-[#8f63d9] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#7f56c7]"
                >
                  Agregar
                </button>
              </div>
            ))}
          </div>
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
            { ...product, periodoDias: CADENCIA_DEFAULT },
          ]);
        }}
        onRemove={(productId) => {
          formik.setFieldValue(
            "items",
            formik.values.items.filter((item) => item.id !== productId),
          );
        }}
      />

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center justify-center rounded-2xl border border-[#ddd6eb] px-5 py-3 text-sm font-semibold text-[#2f3042] transition hover:border-[#c4b5e0]"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={() => void handleContinueProductos()}
          className="inline-flex items-center justify-center rounded-2xl bg-[#8f63d9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f56c7]"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
