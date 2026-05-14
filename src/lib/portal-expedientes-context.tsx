"use client";

import { createContext, useContext } from "react";
import { usePortalExpedientes } from "@/lib/use-portal-expedientes";

type PortalExpedientesContextValue = ReturnType<typeof usePortalExpedientes>;

const PortalExpedientesContext =
  createContext<PortalExpedientesContextValue | null>(null);

type PortalExpedientesProviderProps = {
  children: React.ReactNode;
};

export const PortalExpedientesProvider = ({
  children,
}: PortalExpedientesProviderProps) => {
  const value = usePortalExpedientes();

  return (
    <PortalExpedientesContext.Provider value={value}>
      {children}
    </PortalExpedientesContext.Provider>
  );
};

export const usePortalExpedientesContext = () => {
  const context = useContext(PortalExpedientesContext);

  if (!context) {
    throw new Error(
      "usePortalExpedientesContext must be used within PortalExpedientesProvider",
    );
  }

  return context;
};