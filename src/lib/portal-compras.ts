import type {
  PortalCompraComprobante,
  PortalComprasItem,
  PortalComprasResponse,
  PortalComprasSummary,
} from "@/types/portal-compras";

const normalizeNumber = (value: unknown) => {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const normalizeText = (value: unknown) => {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
};

const getCompraKey = (item: PortalComprasItem, index: number) => {
  return normalizeText(item.compraId) || String(item.idComprobante ?? index);
};

export const formatPortalCurrency = (amount: number, currency = "ARS") => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPortalDateTime = (value: string | null) => {
  if (!value) {
    return "Sin dato";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
};

const buildComprobantes = (items: PortalComprasItem[] | undefined): PortalCompraComprobante[] => {
  const grouped = new Map<string, PortalCompraComprobante>();

  (items ?? []).forEach((item, index) => {
    const key = getCompraKey(item, index);
    const existing = grouped.get(key);
    const lineTotal = normalizeNumber(item.total);
    const currency = normalizeText(item.moneda) || "ARS";

    if (existing) {
      existing.total += lineTotal;
      existing.items.push(item);
      return;
    }

    grouped.set(key, {
      compraId: key,
      comprobanteRef: normalizeText(item.comprobanteRef) || `Comprobante ${key}`,
      fecha: normalizeText(item.fecha) || normalizeText(item.emision),
      nombreFantasia: normalizeText(item.nombreFantasia),
      estado: normalizeText(item.estado),
      moneda: currency,
      total: lineTotal,
      items: [item],
    });
  });

  return Array.from(grouped.values());
};

export const getPortalComprasSummary = (
  compras: PortalComprasResponse | null | undefined,
): PortalComprasSummary => {
  const resumen = compras?.data?.resumen;

  return {
    totalCompras: normalizeNumber(resumen?.totalCompras),
    montoAcumulado: normalizeNumber(resumen?.montoAcumulado),
    moneda: normalizeText(resumen?.moneda) || "ARS",
    partial: compras?.partial === true,
    warnings: Array.isArray(compras?.warnings) ? compras.warnings : [],
    comprobantes: buildComprobantes(compras?.data?.items),
    page: {
      offset: normalizeNumber(compras?.data?.page?.offset),
      limit: normalizeNumber(compras?.data?.page?.limit) || 20,
      hasMore: compras?.data?.page?.hasMore === true,
    },
  };
};