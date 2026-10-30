// "Completá tus datos": qué le falta al perfil. Misma regla que la app SocioSA
// y que el recordatorio de la campanita (bff-cliente-web).

import type { PortalPerfilResponse } from "@/types/portal-profile";

export type PerfilPendiente = "telefono" | "fechaNacimiento" | "domicilio" | "obraSocial";

export const PERFIL_ITEMS_TOTAL = 4;

export const PERFIL_PENDIENTE_TEXTO: Record<PerfilPendiente, { label: string; accion: string }> = {
  telefono: { label: "Celular verificado", accion: "Verificar celular" },
  fechaNacimiento: { label: "Fecha de nacimiento", accion: "Agregar" },
  domicilio: { label: "Domicilio", accion: "Agregar" },
  obraSocial: { label: "Obra social", accion: "Agregar" },
};

export function perfilPendientes(perfil: PortalPerfilResponse | null | undefined): PerfilPendiente[] {
  if (!perfil) return [];
  const pendientes: PerfilPendiente[] = [];
  const telefonoVerificado = (perfil.contactos ?? []).some(
    (c) => c.tipo === "TELEFONO" && c.verificado === true,
  );
  if (!telefonoVerificado) pendientes.push("telefono");
  if (!perfil.fechaNacimiento) pendientes.push("fechaNacimiento");
  if (!perfil.domicilios?.length) pendientes.push("domicilio");
  if (!perfil.afiliaciones?.length) pendientes.push("obraSocial");
  return pendientes;
}

// ---- "Ahora no": la tarjeta se oculta un día y después vuelve a aparecer ----

const OCULTA_KEY = "fsa_perfil_completo_oculta_hasta";
const UN_DIA_MS = 24 * 60 * 60 * 1000;
const listeners = new Set<() => void>();

export function perfilCardOculta(): boolean {
  try {
    return Number(window.localStorage.getItem(OCULTA_KEY)) > Date.now();
  } catch {
    return false;
  }
}

export function ocultarPerfilCardPorUnDia(): void {
  try {
    window.localStorage.setItem(OCULTA_KEY, String(Date.now() + UN_DIA_MS));
  } catch {
    // Sin almacenamiento: se oculta solo hasta recargar.
  }
  listeners.forEach((l) => l());
}

export function suscribirPerfilCard(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
