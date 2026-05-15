import type { PortalPuntosResponse, PortalPuntosSummary } from "@/types/portal-puntos";

const normalizeNumber = (value: unknown) => {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

export const getPortalPuntosSummary = (
  puntos: PortalPuntosResponse | null | undefined,
): PortalPuntosSummary => {
  const saldo = puntos?.data?.saldo;

  return {
    disponibles: normalizeNumber(saldo?.disponibles),
    pendientes: normalizeNumber(saldo?.pendientes),
    porVencer30d: normalizeNumber(saldo?.porVencer30d),
    partial: puntos?.partial === true,
    warnings: Array.isArray(puntos?.warnings) ? puntos.warnings : [],
  };
};

export const formatPortalPoints = (value: number) => {
  return new Intl.NumberFormat("es-AR").format(value);
};