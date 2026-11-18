"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortalMiInvitacion } from "@/types/portal-invitacion";

export type UsePortalInvitacionResult = {
  invitacion: PortalMiInvitacion | null;
  /** Está en la lista y la sección está prendida: se muestra en el menú. */
  invitado: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

/**
 * "Dosis de Conexión". cronicos decide quién está invitado (lista por DNI) y
 * responde siempre OK: con `invitado: null` la sección no aparece.
 * `refrescoMs` sirve para que la vista abierta vea el ingreso y el regalo.
 */
export const usePortalInvitacion = (opciones: { enabled?: boolean; refrescoMs?: number } = {}): UsePortalInvitacionResult => {
  const { enabled = true, refrescoMs } = opciones;
  const [invitacion, setInvitacion] = useState<PortalMiInvitacion | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/me/fiesta/invitacion", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as PortalMiInvitacion | null;
      setInvitacion(res.ok && data ? data : { activo: false, invitado: null });
    } catch {
      setInvitacion((prev) => prev ?? { activo: false, invitado: null });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    void refresh();
    if (!refrescoMs) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, refrescoMs);
    return () => window.clearInterval(id);
  }, [enabled, refrescoMs, refresh]);

  return {
    invitacion,
    invitado: Boolean(invitacion?.activo && invitacion.invitado),
    isLoading,
    refresh,
  };
};
