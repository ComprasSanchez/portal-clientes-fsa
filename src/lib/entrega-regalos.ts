// Entrega de regalos del calendario por el personal (QR que escanea el socio).
import { pedir } from "@/lib/use-portal-calendario";
import type { CalendarioRegalo } from "@/types/portal-calendario";

const BASE = "/api/portal/me/colaborador/entrega-regalos";
const CLAVE_SUCURSAL = "fsa_entrega_regalos_sucursal";

export type QrEntrega = { codigo: string; cambiaAt: string };

export const consultarPermisoEntrega = () => pedir<{ habilitado: boolean }>(`${BASE}/permiso`);

export const pedirQrEntrega = (sucursal: string) => pedir<QrEntrega>(`${BASE}/qr`, { sucursal });

export const listarEntregasRecientes = () => pedir<{ entregas: CalendarioRegalo[] }>(`${BASE}/recientes`);

/** Sucursal donde entrega (se recuerda en este dispositivo). */
export function leerSucursalEntrega(): string | null {
  try {
    return localStorage.getItem(CLAVE_SUCURSAL);
  } catch {
    return null;
  }
}

export function guardarSucursalEntrega(codigo: string) {
  try {
    localStorage.setItem(CLAVE_SUCURSAL, codigo);
  } catch {
    // Sin almacenamiento se vuelve a pedir la próxima vez.
  }
}
