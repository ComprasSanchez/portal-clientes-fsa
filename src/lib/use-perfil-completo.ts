"use client";

import { useSyncExternalStore } from "react";
import {
  ocultarPerfilCardPorUnDia,
  perfilCardOculta,
  perfilPendientes,
  suscribirPerfilCard,
  type PerfilPendiente,
} from "@/lib/perfil-completo";
import type { PortalPerfilResponse } from "@/types/portal-profile";

export type UsePerfilCompletoResult = {
  pendientes: PerfilPendiente[];
  /** Mostrar la tarjeta: faltan datos y no se cerró en las últimas 24 h. */
  visible: boolean;
  ocultar: () => void;
};

export const usePerfilCompleto = (
  perfil: PortalPerfilResponse | null | undefined,
): UsePerfilCompletoResult => {
  // En el servidor se asume oculta, para no mostrarla y sacarla al hidratar.
  const oculta = useSyncExternalStore(suscribirPerfilCard, perfilCardOculta, () => true);
  const pendientes = perfilPendientes(perfil);
  return {
    pendientes,
    visible: !!perfil && pendientes.length > 0 && !oculta,
    ocultar: ocultarPerfilCardPorUnDia,
  };
};
