"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import {
  usePortalNotificaciones,
  type UsePortalNotificacionesResult,
} from "@/lib/use-portal-notificaciones";
import { useGlobalToast } from "@/components/ui/global-toast";

const PortalNotificacionesContext =
  createContext<UsePortalNotificacionesResult | null>(null);

const isDesktopViewport = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 1024px)").matches;

type PortalNotificacionesProviderProps = {
  children: React.ReactNode;
};

export const PortalNotificacionesProvider = ({
  children,
}: PortalNotificacionesProviderProps) => {
  const value = usePortalNotificaciones();
  const { pushToast } = useGlobalToast();
  const seenIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (value.isLoading) return;

    const currentIds = new Set(value.notificaciones.map((item) => item.id));

    // Primer fetch: solo establece la base, no avisa de nada "nuevo" (no es
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

    for (const item of newItems) {
      pushToast({
        id: `notificacion-${item.id}`,
        title: item.title ?? "Notificación",
        description: item.body,
        variant: "info",
        duration: 5000,
      });
    }
  }, [value.notificaciones, value.isLoading, pushToast]);

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
