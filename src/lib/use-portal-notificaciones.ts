"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  PortalNotificacionesResponse,
  PortalNotificacionItem,
} from "@/types/portal-notificaciones";

const POLL_INTERVAL_MS = 30000;

export type UsePortalNotificacionesResult = {
  notificaciones: PortalNotificacionItem[];
  unreadCount: number;
  isLoading: boolean;
  /** Ya llegó al menos una respuesta con la campanita prendida (la lista es real, no la vacía inicial). */
  hasLoaded: boolean;
  markAsRead: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

export const usePortalNotificaciones = (
  enabled = true,
): UsePortalNotificacionesResult => {
  const [notificaciones, setNotificaciones] = useState<
    PortalNotificacionItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [hasLoaded, setHasLoaded] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await fetch("/api/portal/me/notificaciones", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = (await response.json()) as PortalNotificacionesResponse;
      setNotificaciones(data.items ?? []);
      setHasLoaded(true);
    } catch {
      // Silencioso: la campanita no debe romper el resto del portal si
      // notificaciones-fsa está caído.
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setHasLoaded(false);
      setNotificaciones([]);
      return;
    }

    void load();

    pollingRef.current = setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [enabled, load]);

  const markAsRead = useCallback(async (id: string) => {
    setNotificaciones((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: "READ" } : item,
      ),
    );

    try {
      // keepalive: si la notificación tiene link, la página navega enseguida y
      // sin esto el navegador corta el pedido (queda sin leer).
      await fetch(`/api/portal/me/notificaciones/${id}/leida`, {
        method: "PATCH",
        keepalive: true,
      });
    } catch {
      // Si falla, la próxima recarga (polling) va a corregir el estado real.
    }
  }, []);

  const unreadCount = useMemo(
    () => notificaciones.filter((item) => item.status !== "READ").length,
    [notificaciones],
  );

  return {
    notificaciones,
    unreadCount,
    isLoading,
    hasLoaded,
    markAsRead,
    refresh: load,
  };
};
