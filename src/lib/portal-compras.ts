import type {
  PortalCompraComprobante,
  PortalComprasItem,
  PortalComprasProducto,
  PortalComprasResponse,
  PortalComprasSummary,
} from "@/types/portal-compras";

const normalizeNumber = (value: unknown) => {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const arsToPuntos = (amount: number) => Math.round(amount * 10);

const normalizeText = (value: unknown) => {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
};

const getCompraKey = (item: PortalComprasItem, index: number) => {
  return normalizeText(item.compraId) || String(item.idComprobante ?? index);
};

const buildProductos = (item: PortalComprasItem): PortalComprasProducto[] => {
  if (Array.isArray(item.productos) && item.productos.length > 0) {
    return item.productos.map((producto) => ({
      detalle: normalizeText(producto.detalle) || "Producto sin descripcion",
      cantidad: normalizeNumber(producto.cantidad),
      total: normalizeNumber(producto.total),
      cobertura: normalizeNumber(producto.cobertura),
      coberturaPorcentaje: normalizeNumber(producto.coberturaPorcentaje),
      descuento: normalizeNumber(producto.descuento),
      descuentoPorcentaje: normalizeNumber(producto.descuentoPorcentaje),
      recargoPorcentaje: normalizeNumber(producto.recargoPorcentaje),
    }));
  }

  return [
    {
      detalle: normalizeText(item.producto) || "Producto sin descripcion",
      cantidad: normalizeNumber(item.cantidad),
      total: normalizeNumber(item.total),
      cobertura: 0,
      coberturaPorcentaje: 0,
      descuento: 0,
      descuentoPorcentaje: 0,
      recargoPorcentaje: 0,
    },
  ];
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

  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    const calendarDate = new Date(Number(year), Number(month) - 1, Number(day));

    if (!Number.isNaN(calendarDate.getTime())) {
      return new Intl.DateTimeFormat("es-AR", {
        dateStyle: "medium",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(calendarDate);
    }
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
    const productos = buildProductos(item);
    const lineTotal =
      typeof item.total === "number" && Number.isFinite(item.total)
        ? item.total
        : productos.reduce((sum, producto) => sum + normalizeNumber(producto.total), 0);
    const currency = normalizeText(item.moneda) || "ARS";

    if (existing) {
      existing.total += lineTotal;
      existing.items.push(item);
      existing.productos.push(...productos);
      existing.hora = existing.hora || normalizeText(item.hora);
      return;
    }

    grouped.set(key, {
      compraId: key,
      comprobanteRef: normalizeText(item.comprobanteRef) || `Comprobante ${key}`,
      fecha: normalizeText(item.fecha) || normalizeText(item.emision),
      hora: normalizeText(item.hora),
      nombreFantasia: normalizeText(item.nombreFantasia),
      estado: normalizeText(item.estado),
      anulado: item.anulado === true,
      moneda: currency,
      total: lineTotal,
      puntosGanados:
        typeof item.puntosGanados === "number"
          ? item.puntosGanados
          : arsToPuntos(lineTotal),
      productos,
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
