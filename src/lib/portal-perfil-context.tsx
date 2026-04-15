"use client";

import { createContext, useContext } from "react";
import { usePortalPerfil, type UsePortalPerfilResult } from "@/lib/use-portal-perfil";

const PortalPerfilContext = createContext<UsePortalPerfilResult | null>(null);

type PortalPerfilProviderProps = {
  children: React.ReactNode;
};

export const PortalPerfilProvider = ({ children }: PortalPerfilProviderProps) => {
  const value = usePortalPerfil();

  return <PortalPerfilContext.Provider value={value}>{children}</PortalPerfilContext.Provider>;
};

export const usePortalPerfilContext = () => {
  const context = useContext(PortalPerfilContext);

  if (!context) {
    throw new Error("usePortalPerfilContext must be used within PortalPerfilProvider");
  }

  return context;
};