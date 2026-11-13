"use client";

import { useEffect, useState } from "react";
import { isFiestaActiva } from "@/lib/fiesta";

export type UsePortalInvitadoEventoResult = {
  invitadoEvento: boolean;
  isLoading: boolean;
};

/**
 * Invitados al Evento de Fin de Año que no son colaboradores en Plex (ej. PPP).
 * cronicos decide quién entra: si GET /api/portal/me/fiesta responde OK, la
 * persona puede ver la sección del evento (solo esa, no el resto de Colaboradores).
 * Solo consulta con el evento activo y cuando la persona no es colaboradora.
 */
export const usePortalInvitadoEvento = (
  esColaborador: boolean,
  isColaboradorLoading: boolean,
): UsePortalInvitadoEventoResult => {
  const consultar = isFiestaActiva() && !isColaboradorLoading && !esColaborador;
  const [resultado, setResultado] = useState<boolean | null>(null);

  useEffect(() => {
    if (!consultar) return;
    const controller = new AbortController();
    void fetch("/api/portal/me/fiesta", { cache: "no-store", signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) setResultado(res.ok);
      })
      .catch(() => {
        if (!controller.signal.aborted) setResultado(false);
      });
    return () => controller.abort();
  }, [consultar]);

  if (!isFiestaActiva() || (!isColaboradorLoading && esColaborador)) {
    return { invitadoEvento: false, isLoading: false };
  }
  return { invitadoEvento: resultado === true, isLoading: isColaboradorLoading || resultado === null };
};
