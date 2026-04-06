import React, { useState } from "react";
import PortalStepper from "../../stepper/stepper";
import PedidoAccordion, {
  PedidoItem,
} from "../../pedido-accordion.tsx/pedido-accordion";
import PortalInput from "../../portal-input/input";
import PortalButton from "@/components/atoms/button/button";
import AddressSelector, { AddressItem } from "../../address-selector/address-selector";

type PedidosStep2Props = {
  setStep: (step: number) => void;
};

const PedidosStep2 = ({ setStep }: PedidosStep2Props) => {
  const [producto, setProducto] = useState("");
  const [selectedId, setSelectedId] = useState("1");

  const direcciones: AddressItem[] = [
    {
      id: "1",
      direccion: "Av. Talleres 1288 - B° Jardín",
      detalle: "Córdoba Capital",
    },
    {
      id: "2",
      direccion: "Av. Colón 2450",
      detalle: "Córdoba Capital",
    },
  ];

  return (
    <div>
      <div className="w-full p-5">
        <h4 className="flex items-center justify-center pt-6 text-[#8C6FAF] text-bold text-[22px]">
          Coordinamos tu entrega
        </h4>
        <PortalStepper currentStep={2} />
        <div className="flex flex-col">
          <p className="flex items-center justify-center text-[#8C6FAF] text-bold text-[22px]">
            ¡Farid!
          </p>
          <p className="flex text-center items-center justify-center text-[#8C6FAF] text-bold text-[18px]">
            ¿Cómo querés recibir tu pedido?
          </p>
        </div>
        <div className="max-w-105 mx-auto py-6">
          <div style={{ display: "flex", flexDirection: "row", gap: 14 }}>
            <PortalButton variant="primary">En mi domicilio</PortalButton>
            <PortalButton variant="secondary">
              Retiro en la sucursal
            </PortalButton>
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col">
            <p className="flex text-center items-center justify-center text-[#8C6FAF] text-bold text-[18px]">
              ¿Dónde lo querés recibir?
            </p>
          </div>
          <AddressSelector
            items={direcciones}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <PortalButton variant="secondary">
            Agregar otra dirección
          </PortalButton>
          {/* 
          <p
            style={{
              color: "#8C6FAF",
              fontSize: "0.95rem",
              fontWeight: 500,
              margin: "14px 0 20px",
            }}
          >
            Buscá y agregá nuevos productos a tu carrito
          </p> */}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <PortalButton variant="primary" onClick={() => setStep(3)}>
              Confirmar selección
            </PortalButton>

            <PortalButton variant="secondary" withChatIcon>
              Hablar con CORA
            </PortalButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidosStep2;
