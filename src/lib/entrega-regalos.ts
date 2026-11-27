// Entrega de regalos del calendario por el personal (QR que escanea el socio).
import { pedir } from "@/lib/use-portal-calendario";
import type { CalendarioRegalo, CalendarioSocioRetiro } from "@/types/portal-calendario";

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

export type EntregaAgrupada = {
  clave: string;
  socio: CalendarioSocioRetiro | null;
  retiradoAt: string | null;
  regalos: CalendarioRegalo[];
};

/** Junta los regalos que se entregaron en un mismo escaneo (mismo socio y hora). */
export function agruparEntregas(entregas: CalendarioRegalo[]): EntregaAgrupada[] {
  const grupos = new Map<string, EntregaAgrupada>();
  for (const e of entregas) {
    const clave = `${e.socio?.dni ?? "?"}|${e.retiradoAt ?? ""}`;
    const grupo = grupos.get(clave) ?? { clave, socio: e.socio ?? null, retiradoAt: e.retiradoAt, regalos: [] };
    grupo.regalos.push(e);
    grupos.set(clave, grupo);
  }
  return [...grupos.values()];
}

/** "30.111.222" */
export const dniConPuntos = (dni: string) => dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
