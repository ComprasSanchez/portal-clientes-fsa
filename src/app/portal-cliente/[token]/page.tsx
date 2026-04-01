"use client";
import Header from "@/components/molecules/header/header";
import { useState } from "react";
import PedidosStep1 from "@/components/molecules/pedidos-steps/pedidos-step-1/pedidos-step-1";
import PedidosStep2 from "@/components/molecules/pedidos-steps/pedidos-step-2/pedidos-step-2";
import PedidosStep3 from "@/components/molecules/pedidos-steps/pedidos-step-3/pedidos-step-3";
import { Metadata } from "next";


const PortalCliente = () => {
  const [step, setStep] = useState(1);

  return (
    <>
      <Header
        showBackButton={step > 1}
        onBack={() => setStep((prev) => Math.max(1, prev - 1))}
      />

      {step === 1 && <PedidosStep1 setStep={setStep} />}
      {step === 2 && <PedidosStep2 setStep={setStep} />}
      {step === 3 && <PedidosStep3 setStep={setStep} />}
    </>
  );
};

export default PortalCliente;
