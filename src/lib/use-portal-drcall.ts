"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActivarCuentaDrCallBody, PortalCuentaDrCall } from "@/types/portal-invitacion";

/** Mensajes en simple para lo que no trae un texto claro desde el back. */
function mensajeDeError(status: number, data: unknown): string {
  const d = (data ?? {}) as { message?: unknown; code?: unknown };
  const message = Array.isArray(d.message) ? d.message[0] : d.message;
  if (status === 422 && typeof message === "string" && message) return message;
  if (status === 400 && typeof message === "string" && message) return message;
  if (status === 503) return "Dr. Call todavía no está disponible. Probá más tarde.";
  if (status >= 500) return "Dr. Call no está respondiendo. Probá de nuevo en unos minutos.";
  return "No pudimos activar tu cuenta. Probá de nuevo.";
}

export type UsePortalDrCallResult = {
  cuenta: PortalCuentaDrCall | null;
  isLoading: boolean;
  activando: boolean;
  error: string | null;
  activar: (body: ActivarCuentaDrCallBody) => Promise<boolean>;
};

/** "Dosis de Conexión": la cuenta de Dr. Call del invitado (alta como médico o paciente). */
export const usePortalDrCall = (enabled = true): UsePortalDrCallResult => {
  const [cuenta, setCuenta] = useState<PortalCuentaDrCall | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    let vivo = true;
    (async () => {
      try {
        const res = await fetch("/api/portal/me/fiesta/invitacion/drcall", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as PortalCuentaDrCall | null;
        if (vivo && res.ok && data) setCuenta(data);
      } catch {
        // Sin la tarjeta no se rompe nada: el resto de la sección sigue igual.
      } finally {
        if (vivo) setIsLoading(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [enabled]);

  const activar = useCallback(async (body: ActivarCuentaDrCallBody) => {
    setActivando(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/me/fiesta/invitacion/drcall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(mensajeDeError(res.status, data));
        return false;
      }
      setCuenta(data as PortalCuentaDrCall);
      return true;
    } catch {
      setError("No pudimos conectarnos. Revisá tu conexión y probá de nuevo.");
      return false;
    } finally {
      setActivando(false);
    }
  }, []);

  return { cuenta, isLoading, activando, error, activar };
};
