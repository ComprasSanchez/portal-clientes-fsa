import PortalPedido from "@/components/organisms/portal-pedido/portal-pedido";
import Header from "@/components/molecules/header/header";
import React from "react";
import PortalStepper from "@/components/molecules/stepper/stepper";

const PortalCliente = () => {
  return (
    <>
      <Header />
      <div className="w-full">
        <h4 className="flex items-center justify-center pt-[40px] text-[#8C6FAF] text-bold text-[22px]">Preparación de tu pedido</h4>
        <PortalStepper currentStep={1} />
        <div className="flex flex-col">
            <p className="flex items-center justify-center text-[#8C6FAF] text-bold text-[22px]">¡Farid!</p>
            <p className="flex items-center justify-center text-[#8C6FAF] text-bold text-[18px]">Estos son los productos que usás habitualmente:</p>
        </div>
      </div>
    </>
  );
};

export default PortalCliente;
