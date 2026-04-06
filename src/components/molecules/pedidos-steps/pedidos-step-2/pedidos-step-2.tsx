import React, { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import PortalStepper from "../../stepper/stepper";
import PortalButton from "@/components/atoms/button/button";
import AddressSelector, {
  AddressItem,
} from "../../address-selector/address-selector";
import PortalInput from "../../portal-input/input";
import type {
  Domicilio,
  OccasionalAddress,
  Sucursal,
} from "@/types/magic-link-type";

type PedidosStep2Props = {
  domicilios: Domicilio[];
  sucursales: Sucursal[];
  selectedMethod: "domicilio" | "sucursal";
  selectedDomicilioId: string | null;
  selectedSucursalId: number | null;
  selectedOccasionalAddress: OccasionalAddress | null;
  isOccasionalAddressSaved: boolean;
  onConfirmSelection: (selection: {
    method: "domicilio" | "sucursal";
    domicilioId?: string;
    sucursalId?: number;
    occasionalAddress?: OccasionalAddress;
    occasionalAddressSaved?: boolean;
  }) => void;
  onSaveOccasionalAddress: (address: OccasionalAddress) => Promise<void>;
  onContactAdvisor: () => void;
};

type AddressFormValues = OccasionalAddress & {
  noCp: boolean;
};

const SUCURSAL_PAGE_SIZE = 4;

const addressSchema = Yup.object({
  calle: Yup.string().trim().required("Ingresá la calle"),
  numero: Yup.string().trim().required("Ingresá el número"),
  cp: Yup.string().when("noCp", {
    is: false,
    then: (schema) => schema.trim().required("Ingresá el código postal"),
    otherwise: (schema) => schema.trim(),
  }),
  ciudad: Yup.string().trim().required("Ingresá la ciudad"),
  provincia: Yup.string().trim().required("Ingresá la provincia"),
  pais: Yup.string().trim().required("Ingresá el país"),
  referencia: Yup.string().trim(),
  noCp: Yup.boolean().required(),
});

const formatDomicilio = (domicilio: Domicilio): AddressItem => {
  const direccion = [
    domicilio.calle,
    domicilio.numero,
    domicilio.piso ? `Piso ${domicilio.piso}` : "",
    domicilio.depto ? `Dpto ${domicilio.depto}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: domicilio.id,
    direccion: direccion || domicilio.etiqueta,
    detalle: [domicilio.ciudad, domicilio.provincia].filter(Boolean).join(", "),
  };
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const PedidosStep2 = ({
  domicilios,
  sucursales,
  selectedMethod,
  selectedDomicilioId,
  selectedSucursalId,
  selectedOccasionalAddress,
  isOccasionalAddressSaved,
  onConfirmSelection,
  onSaveOccasionalAddress,
  onContactAdvisor,
}: PedidosStep2Props) => {
  const [deliveryMethod, setDeliveryMethod] = useState<"domicilio" | "sucursal">(
    selectedMethod,
  );
  const [addressMode, setAddressMode] = useState<"guardado" | "ocasional">(
    "guardado",
  );
  const [currentDomicilioId, setCurrentDomicilioId] = useState<string | undefined>(
    selectedDomicilioId ?? domicilios.find((item) => item.principal)?.id,
  );
  const [currentSucursalId, setCurrentSucursalId] = useState<string | undefined>(
    selectedSucursalId ? String(selectedSucursalId) : undefined,
  );
  const [useSavedOccasional, setUseSavedOccasional] = useState(
    Boolean(selectedOccasionalAddress && isOccasionalAddressSaved && !selectedDomicilioId),
  );
  const [savingAddress, setSavingAddress] = useState(false);
  const [sucursalSearchQuery, setSucursalSearchQuery] = useState("");
  const [sucursalPage, setSucursalPage] = useState(1);

  useEffect(() => {
    if (!currentDomicilioId) {
      setCurrentDomicilioId(domicilios.find((item) => item.principal)?.id ?? domicilios[0]?.id);
    }
  }, [currentDomicilioId, domicilios]);

  useEffect(() => {
    if (domicilios.length === 0 && !selectedOccasionalAddress) {
      setAddressMode("ocasional");
    }
  }, [domicilios.length, selectedOccasionalAddress]);

  const domicilioItems = useMemo(() => domicilios.map(formatDomicilio), [domicilios]);
  const sucursalItems = useMemo(
    () =>
      sucursales.map((sucursal) => ({
        id: String(sucursal.id),
        direccion: sucursal.nombre,
        detalle: sucursal.direccion,
      })),
    [sucursales],
  );
  const filteredSucursalItems = useMemo(() => {
    const query = normalizeText(sucursalSearchQuery);

    if (!query) {
      return sucursalItems;
    }

    return sucursalItems.filter((sucursal) => {
      const haystack = normalizeText(
        `${sucursal.id} ${sucursal.direccion} ${sucursal.detalle}`,
      );

      return haystack.includes(query);
    });
  }, [sucursalItems, sucursalSearchQuery]);
  const totalSucursalPages = Math.max(
    1,
    Math.ceil(filteredSucursalItems.length / SUCURSAL_PAGE_SIZE),
  );
  const paginatedSucursalItems = useMemo(() => {
    const startIndex = (sucursalPage - 1) * SUCURSAL_PAGE_SIZE;

    return filteredSucursalItems.slice(startIndex, startIndex + SUCURSAL_PAGE_SIZE);
  }, [filteredSucursalItems, sucursalPage]);

  useEffect(() => {
    setSucursalPage(1);
  }, [sucursalSearchQuery]);

  useEffect(() => {
    if (sucursalPage > totalSucursalPages) {
      setSucursalPage(totalSucursalPages);
    }
  }, [sucursalPage, totalSucursalPages]);

  const formik = useFormik<AddressFormValues>({
    initialValues: {
      calle: selectedOccasionalAddress?.calle ?? "",
      numero: selectedOccasionalAddress?.numero ?? "",
      cp: selectedOccasionalAddress?.cp ?? "",
      ciudad: selectedOccasionalAddress?.ciudad ?? "",
      provincia: selectedOccasionalAddress?.provincia ?? "Córdoba",
      pais: selectedOccasionalAddress?.pais ?? "Argentina",
      referencia: selectedOccasionalAddress?.referencia ?? "",
      noCp: Boolean(selectedOccasionalAddress && !selectedOccasionalAddress.cp),
    },
    validationSchema: addressSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      const payload: OccasionalAddress = {
        calle: values.calle.trim(),
        numero: values.numero.trim(),
        cp: values.noCp ? "" : values.cp.trim(),
        ciudad: values.ciudad.trim(),
        provincia: values.provincia.trim(),
        pais: values.pais.trim(),
        referencia: values.referencia.trim(),
      };

      try {
        setSavingAddress(true);
        await onSaveOccasionalAddress(payload);
        setAddressMode("guardado");
        setUseSavedOccasional(true);
        setCurrentDomicilioId(undefined);
      } finally {
        setSavingAddress(false);
      }
    },
  });

  const canConfirm =
    deliveryMethod === "domicilio"
      ? addressMode === "guardado"
        ? Boolean(currentDomicilioId) || Boolean(useSavedOccasional && selectedOccasionalAddress)
        : false
      : Boolean(currentSucursalId);

  const handleConfirm = () => {
    if (deliveryMethod === "domicilio") {
      if (useSavedOccasional && selectedOccasionalAddress && isOccasionalAddressSaved) {
        onConfirmSelection({
          method: "domicilio",
          occasionalAddress: selectedOccasionalAddress,
          occasionalAddressSaved: true,
        });
        return;
      }

      if (currentDomicilioId) {
        onConfirmSelection({
          method: "domicilio",
          domicilioId: currentDomicilioId,
        });
      }

      return;
    }

    if (currentSucursalId) {
      const sucursalId = Number.parseInt(currentSucursalId, 10);

      if (!Number.isInteger(sucursalId) || sucursalId < 1) {
        return;
      }

      onConfirmSelection({
        method: "sucursal",
        sucursalId,
      });
    }
  };

  const getError = (field: keyof AddressFormValues) =>
    formik.touched[field] ? formik.errors[field] : undefined;

  return (
    <div>
      <div className="w-full p-5">
        <h4 className="flex items-center justify-center pt-6 text-[#8C6FAF] text-bold text-[22px]">
          Coordinamos tu entrega
        </h4>
        <PortalStepper currentStep={2} />
        <div className="flex flex-col">
          <p className="flex text-center items-center justify-center text-[#8C6FAF] text-bold text-[18px]">
            ¿Cómo querés recibir tu pedido?
          </p>
        </div>

        <div className="max-w-105 mx-auto py-6">
          <div style={{ display: "flex", flexDirection: "row", gap: 14 }}>
            <PortalButton
              variant={deliveryMethod === "domicilio" ? "primary" : "secondary"}
              onClick={() => setDeliveryMethod("domicilio")}
            >
              En mi domicilio
            </PortalButton>
            <PortalButton
              variant={deliveryMethod === "sucursal" ? "primary" : "secondary"}
              onClick={() => setDeliveryMethod("sucursal")}
            >
              Retiro en la sucursal
            </PortalButton>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col">
            <p className="flex text-center items-center justify-center text-[#8C6FAF] text-bold text-[18px]">
              {deliveryMethod === "domicilio"
                ? "¿Dónde lo querés recibir?"
                : "Elegí la sucursal de retiro"}
            </p>
          </div>

          {deliveryMethod === "domicilio" ? (
            <>
              {addressMode === "guardado" && domicilioItems.length > 0 && (
                <AddressSelector
                  items={domicilioItems}
                  selectedId={useSavedOccasional ? undefined : currentDomicilioId}
                  onSelect={(id) => {
                    setUseSavedOccasional(false);
                    setCurrentDomicilioId(id);
                  }}
                />
              )}

              {selectedOccasionalAddress && isOccasionalAddressSaved && addressMode === "guardado" && (
                <button
                  type="button"
                  className={`rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ${
                    useSavedOccasional ? "ring-[#8C6FAF]" : "ring-[#8C6FAF]/10"
                  }`}
                  onClick={() => {
                    setUseSavedOccasional(true);
                    setCurrentDomicilioId(undefined);
                  }}
                >
                  <p className="text-base font-bold text-[#8C6FAF]">Domicilio temporal</p>
                  <p className="text-sm text-[#8C6FAF]/80">
                    {selectedOccasionalAddress.calle} {selectedOccasionalAddress.numero}
                  </p>
                  <p className="text-sm text-[#8C6FAF]/70">
                    {selectedOccasionalAddress.ciudad}, {selectedOccasionalAddress.provincia}
                  </p>
                </button>
              )}

              {addressMode === "ocasional" ? (
                <form className="rounded-3xl bg-white p-5 shadow-sm" onSubmit={formik.handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { name: "calle", label: "Calle" },
                      { name: "numero", label: "Número" },
                      { name: "cp", label: "Código postal" },
                      { name: "ciudad", label: "Ciudad" },
                      { name: "provincia", label: "Provincia" },
                      { name: "pais", label: "País" },
                    ].map((field) => {
                      const key = field.name as keyof AddressFormValues;

                      return (
                        <label key={field.name} className="flex flex-col gap-2 text-sm text-[#8C6FAF]">
                          <span>{field.label}</span>
                          <input
                            name={field.name}
                            value={formik.values[key] as string}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={field.name === "cp" && formik.values.noCp}
                            className={`rounded-2xl border px-4 py-3 outline-none transition-colors ${
                              field.name === "cp" && formik.values.noCp
                                ? "cursor-not-allowed border-[#8C6FAF]/10 bg-[#8C6FAF]/8 text-[#8C6FAF]/35"
                                : getError(key)
                                  ? "border-red-400 bg-white text-[#8C6FAF]"
                                  : "border-[#8C6FAF]/20 bg-white text-[#8C6FAF]"
                            }`}
                          />
                          {getError(key) && (
                            <span className="text-xs text-red-500">{getError(key)}</span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  <label className="mt-4 flex flex-col gap-2 text-sm text-[#8C6FAF]">
                    <span>Referencia</span>
                    <input
                      name="referencia"
                      value={formik.values.referencia}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="rounded-2xl border border-[#8C6FAF]/20 px-4 py-3 outline-none"
                    />
                  </label>

                  <label className="mt-4 flex items-center gap-3 text-sm text-[#8C6FAF]">
                    <input
                      type="checkbox"
                      name="noCp"
                      checked={formik.values.noCp}
                      onChange={(event) => {
                        const checked = event.target.checked;

                        formik.setFieldValue("noCp", checked);

                        if (checked) {
                          formik.setFieldValue("cp", "");
                          formik.setFieldTouched("cp", false);
                        }
                      }}
                    />
                    No sé mi código postal
                  </label>

                  <div className="mt-5 flex flex-col gap-3">
                    <PortalButton type="submit" disabled={savingAddress}>
                      {savingAddress ? "Guardando dirección..." : "Guardar dirección"}
                    </PortalButton>
                    <PortalButton variant="secondary" onClick={() => setAddressMode("guardado")}>
                      Volver a domicilios guardados
                    </PortalButton>
                  </div>
                </form>
              ) : (
                <PortalButton variant="secondary" onClick={() => setAddressMode("ocasional")}>
                  Agregar otra dirección
                </PortalButton>
              )}
            </>
          ) : (
            <>
              <PortalInput
                label="Buscar sucursal"
                variant="search"
                value={sucursalSearchQuery}
                placeholder="Buscá por nombre, dirección o número"
                onChange={setSucursalSearchQuery}
              />

              {filteredSucursalItems.length > 0 ? (
                <>
                  <AddressSelector
                    items={paginatedSucursalItems}
                    selectedId={currentSucursalId}
                    onSelect={(id) => setCurrentSucursalId(id)}
                  />

                  <div className="flex items-center justify-between rounded-3xl bg-white p-4 text-sm text-[#8C6FAF] shadow-sm">
                    <p>
                      Página {sucursalPage} de {totalSucursalPages} ({filteredSucursalItems.length} sucursales)
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="rounded-full border border-[#8C6FAF] px-4 py-2 disabled:opacity-50"
                        onClick={() => setSucursalPage((current) => Math.max(1, current - 1))}
                        disabled={sucursalPage <= 1}
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-[#8C6FAF] px-4 py-2 disabled:opacity-50"
                        onClick={() =>
                          setSucursalPage((current) => Math.min(totalSucursalPages, current + 1))
                        }
                        disabled={sucursalPage >= totalSucursalPages}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl bg-white p-5 text-center text-[#8C6FAF] shadow-sm">
                  No encontramos sucursales para esa búsqueda.
                </div>
              )}
            </>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <PortalButton variant="primary" onClick={handleConfirm} disabled={!canConfirm}>
              Confirmar selección
            </PortalButton>

            <PortalButton variant="secondary" withChatIcon onClick={onContactAdvisor}>
              Hablar con CORA
            </PortalButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidosStep2;