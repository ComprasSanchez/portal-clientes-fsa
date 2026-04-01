import React, { useState } from "react";
import PortalStepper from "../../stepper/stepper";
import PedidoAccordion, { PedidoItem } from "../../pedido-accordion.tsx/pedido-accordion";
import PortalInput from "../../portal-input/input";
import PortalButton from "@/components/atoms/button/button";

type PedidosStep1Props = {
  setStep: (step: number) => void;
};

const PedidosStep1 = ({ setStep }: PedidosStep1Props) => {
  const [producto, setProducto] = useState("");

  const items: PedidoItem[] = [
    {
      id: "1",
      nombre: "AMOXIDAL 1 g comp. x 16",
      laboratorio: "ROEMMERS",
      cantidad: 1,
      checked: true,
    },
    {
      id: "2",
      nombre: "AMOXIDAL 1 g iny. x 1 dosis",
      laboratorio: "ROEMMERS",
      cantidad: 1,
      checked: false,
    },
  ];

  return (
    <div>
      <div className="w-full p-5">
        <h4 className="flex items-center justify-center pt-6 text-[#8C6FAF] text-bold text-[22px]">
          Preparación de tu pedido
        </h4>
        <PortalStepper currentStep={1} />
        <div className="flex flex-col">
          <p className="flex items-center justify-center text-[#8C6FAF] text-bold text-[22px]">
            ¡Farid!
          </p>
          <p className="flex text-center items-center justify-center text-[#8C6FAF] text-bold text-[18px]">
            Estos son los productos que usás habitualmente:
          </p>
        </div>
        <div className="max-w-105 mx-auto py-6">
          <PedidoAccordion
            items={items}
            onToggle={(id, checked) => {
              console.log("toggle:", id, checked);
            }}
          />
        </div>
        <div className="flex flex-col gap-5">
          <PortalInput
            variant="add-product"
            value={producto}
            onChange={setProducto}
          />

          <p
            style={{
              color: "#8C6FAF",
              fontSize: "0.95rem",
              fontWeight: 500,
              margin: "14px 0 20px",
            }}
          >
            Buscá y agregá nuevos productos a tu carrito
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <PortalButton variant="primary" onClick={() => setStep(2)}>
              Confirmar pedido
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

export default PedidosStep1;
