"use client";
import Header from "@/components/molecules/header/header";
import { useState } from "react";
import CartView, { CartViewItem } from "@/components/molecules/cart-view/cart-view";
import PedidosStep1 from "@/components/molecules/pedidos-steps/pedidos-step-1/pedidos-step-1";
import PedidosStep2 from "@/components/molecules/pedidos-steps/pedidos-step-2/pedidos-step-2";
import PedidosStep3 from "@/components/molecules/pedidos-steps/pedidos-step-3/pedidos-step-3";

const initialItems: CartViewItem[] = [
  {
    id: "1",
    nombre: "AMOXIDAL 1 g comp. x 16",
    laboratorio: "ROEMMERS",
  },
  {
    id: "2",
    nombre: "AMOXIDAL 1 g iny. 1 dosis",
    laboratorio: "ROEMMERS",
  },
  {
    id: "3",
    nombre: "Insulina iny. 1 dosis",
    laboratorio: "DANICO",
  },
];


const PortalCliente = () => {
  const [step, setStep] = useState(1);
  const [openCart, setOpenCart] = useState(false);
  // Demo items, reemplazar por items reales del carrito
  const [cartItems, setCartItems] = useState<CartViewItem[]>(initialItems);

  const handleRemoveFromCart = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  return (
    <>
      <Header
        showBackButton={step > 1}
        onBack={() => setStep((prev) => Math.max(1, prev - 1))}
        onCartClick={() => setOpenCart(true)}
        cartCount={cartItems.length}
      />

      <CartView
        open={openCart}
        items={cartItems}
        onClose={() => setOpenCart(false)}
        onRemove={handleRemoveFromCart}
      />

      {step === 1 && <PedidosStep1 setStep={setStep} />}
      {step === 2 && <PedidosStep2 setStep={setStep} />}
      {step === 3 && <PedidosStep3 setStep={setStep} />}
    </>
  );
};

export default PortalCliente;
