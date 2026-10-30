"use client";

import { useSyncExternalStore } from "react";
import { leerFlowSnapshot, suscribirFlow, type AuthFlow } from "@/lib/auth-nuevo";

/**
 * Datos del ingreso / registro nuevo guardados entre pantallas (email, "recordar",
 * código pedido). `null` mientras renderiza en el servidor o en la primera pasada
 * del navegador (todavía no se leyó el almacenamiento).
 */
export const useAuthFlow = (): AuthFlow | null =>
  useSyncExternalStore(suscribirFlow, leerFlowSnapshot, () => null);
