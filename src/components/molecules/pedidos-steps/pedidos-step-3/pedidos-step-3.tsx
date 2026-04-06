import React, { useState } from "react";
import PortalStepper from "../../stepper/stepper";
import PortalButton from "@/components/atoms/button/button";
import AddressSelector, {
  AddressItem,
} from "../../address-selector/address-selector";
import ConfirmProductsAccordion, { ConfirmProductItem } from "../../confirm-accordion/confirm-accordion";
import ConfirmDeliveryAccordion, { ConfirmDeliveryData } from "../../confirm-delivery/confirm-delivery";

type PedidosStep3Props = {
  setStep: (step: number) => void;
};

const PedidosStep3 = ({}: PedidosStep3Props) => {
  const [producto, setProducto] = useState("");
  const [selectedId, setSelectedId] = useState("1");

  const productos: ConfirmProductItem[] = [
    {
      id: "1",
      nombre: "AMOXIDAL 1 g comp. x 16",
      laboratorio: "ROEMMERS",
      cantidad: 1,
    },
    {
      id: "2",
      nombre: "AMOXIDAL 1 g iny. 1 dosis",
      laboratorio: "ROEMMERS",
      cantidad: 1,
    },
    {
      id: "3",
      nombre: "Insulina iny. 1 dosis",
      laboratorio: "DANICO",
      cantidad: 1,
    },
  ];

  const entrega: ConfirmDeliveryData = {
    tipo: "domicilio",
    direccion: "Av. Talleres 1288 - B° Jardín",
    detalle: "Córdoba Capital",
  };

  return (
    <div>
      <div className="w-full p-5">
        <h4 className="flex items-center justify-center pt-6 text-[#8C6FAF] text-bold text-[22px]">
          Ya casi terminamos
        </h4>
        <PortalStepper currentStep={3} />
        <div className="flex flex-col pb-5">
          <p className="flex items-center justify-center text-[#8C6FAF] text-bold text-[22px]">
            ¡Estoy procesando tu pedido!
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <ConfirmProductsAccordion items={productos} />
          <ConfirmDeliveryAccordion data={entrega} />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <PortalButton variant="primary">Confirmar selección</PortalButton>

            <PortalButton variant="secondary" withChatIcon>
              Hablar con CORA
            </PortalButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidosStep3;
