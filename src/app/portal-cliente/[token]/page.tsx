"use client";
import PortalPedido from "@/components/organisms/portal-pedido/portal-pedido";
import Header from "@/components/molecules/header/header";
import React from "react";
import PortalStepper from "@/components/molecules/stepper/stepper";
import PedidoAccordion, {
  PedidoItem,
} from "@/components/molecules/pedido-accordion.tsx/pedido-accordion";

const PortalCliente = () => {
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
    <>
      <Header />
      <div className="w-full">
        <h4 className="flex items-center justify-center pt-[40px] text-[#8C6FAF] text-bold text-[22px]">
          Preparación de tu pedido
        </h4>
        <PortalStepper currentStep={1} />
        <div className="flex flex-col">
          <p className="flex items-center justify-center text-[#8C6FAF] text-bold text-[22px]">
            ¡Farid!
          </p>
          <p className="flex items-center justify-center text-[#8C6FAF] text-bold text-[18px]">
            Estos son los productos que usás habitualmente:
          </p>
        </div>
        <div className="max-w-[420px] mx-auto p-6">
          <PedidoAccordion
            items={items}
            onToggle={(id, checked) => {
              console.log("toggle:", id, checked);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default PortalCliente;
