"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import {
  usePortalNotificaciones,
  type UsePortalNotificacionesResult,
} from "@/lib/use-portal-notificaciones";
import { useGlobalToast } from "@/components/ui/global-toast";
import { useIdentidad } from "@/lib/portal-identidad-context";

const PortalNotificacionesContext =
  createContext<UsePortalNotificacionesResult | null>(null);

const MAX_TOASTS_INDIVIDUALES = 3;

const isDesktopViewport = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 1024px)").matches;

type PortalNotificacionesProviderProps = {
  children: React.ReactNode;
};

export const PortalNotificacionesProvider = ({
  children,
}: PortalNotificacionesProviderProps) => {
  // Sin cuenta vinculada (modo limitado) no se pide: respondería 403.
  const { vinculada } = useIdentidad();
  const value = usePortalNotificaciones(vinculada);
  const { pushToast } = useGlobalToast();
  const seenIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    // Mientras se consulta la identidad la campanita está apagada y la lista
    // viene vacía: tomarla como base hacía que al prenderse todo pareciera nuevo.
    if (!value.hasLoaded) {
      seenIdsRef.current = null;
      return;
    }

    const currentIds = new Set(value.notificaciones.map((item) => item.id));

    // Primera respuesta: solo establece la base, no avisa de nada "nuevo" (no es
    // nuevo, ya existía antes de que se abriera el portal).
    if (seenIdsRef.current === null) {
      seenIdsRef.current = currentIds;
      return;
    }

    const previousIds = seenIdsRef.current;
    const newItems = value.notificaciones.filter(
      (item) => !previousIds.has(item.id),
    );
    seenIdsRef.current = currentIds;

    if (newItems.length === 0 || !isDesktopViewport()) return;

    // Muchas juntas: un solo aviso en vez de una pila.
    if (newItems.length > MAX_TOASTS_INDIVIDUALES) {
      pushToast({
        id: "notificaciones-nuevas",
        title: `Tenés ${newItems.length} notificaciones nuevas`,
        description: "Miralas en la campanita.",
        variant: "info",
        duration: 5000,
      });
      return;
    }

    for (const item of newItems) {
      pushToast({
        id: `notificacion-${item.id}`,
        title: item.title ?? "Notificación",
        description: item.body,
        variant: "info",
        duration: 5000,
      });
    }
  }, [value.notificaciones, value.hasLoaded, pushToast]);

  return (
    <PortalNotificacionesContext.Provider value={value}>
      {children}
    </PortalNotificacionesContext.Provider>
  );
};

export const usePortalNotificacionesContext = () => {
  const context = useContext(PortalNotificacionesContext);

  if (!context) {
    throw new Error(
      "usePortalNotificacionesContext must be used within PortalNotificacionesProvider",
    );
  }

  return context;
};
