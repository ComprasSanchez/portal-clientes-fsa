"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { consultarIdentidad, isLoginNuevoActivo, type IdentidadStatus } from "@/lib/auth-nuevo";

export type IdentidadContextValue = {
  /** Todavía se está consultando: no mostrar ni pedir datos del cliente. */
  cargando: boolean;
  /** La cuenta está vinculada al cliente (DNI): se pueden pedir sus datos. */
  vinculada: boolean;
  status: IdentidadStatus;
  recargar: () => void;
};

// Fuera del provider (o con el login nuevo apagado): se asume vinculada y el
// IdentityLinkGuard de siempre se encarga de las cuentas sin vincular.
const VINCULADA: IdentidadContextValue = {
  cargando: false,
  vinculada: true,
  status: "LINKED",
  recargar: () => undefined,
};

const PortalIdentidadContext = createContext<IdentidadContextValue>(VINCULADA);

/**
 * Modo limitado (login nuevo): una cuenta sin vincular al cliente entra al
 * portal, pero no se le piden datos del cliente (responderían 403) y las
 * secciones muestran "Validá tu identidad".
 */
export const PortalIdentidadProvider = ({ children }: { children: React.ReactNode }) => {
  const activo = isLoginNuevoActivo();
  const [status, setStatus] = useState<IdentidadStatus | null>(activo ? null : "LINKED");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!activo) return;
    let cancelado = false;
    consultarIdentidad()
      .then((r) => {
        // Con `self_contact` puede validar sola: no se la manda a la sucursal.
        if (!cancelado) setStatus(r.status === "UNAVAILABLE" && r.self_contact ? "PENDING" : r.status);
      })
      .catch(() => {
        // Si no se puede consultar, el portal se comporta como siempre (los
        // datos que fallen muestran su error) en vez de bloquear todo.
        if (!cancelado) setStatus("LINKED");
      });
    return () => {
      cancelado = true;
    };
  }, [activo, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  const value: IdentidadContextValue =
    status === null
      ? { cargando: true, vinculada: false, status: "PENDING", recargar }
      : { cargando: false, vinculada: status === "LINKED", status, recargar };

  return <PortalIdentidadContext.Provider value={value}>{children}</PortalIdentidadContext.Provider>;
};

export const useIdentidad = () => useContext(PortalIdentidadContext);
