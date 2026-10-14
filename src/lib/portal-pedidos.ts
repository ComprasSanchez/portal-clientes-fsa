import type { BadgeColor } from "@/components/atoms/badge/badge";
import type { TimelineStep } from "@/components/molecules/timeline/timeline";
import {
  PEDIDO_CANAL_LABELS,
  PLEX_ESTADO_LABELS,
  type PedidoCanal,
  type PedidoNormalizado,
} from "@/types/portal-pedidos";
import type { UiTone } from "@/types/ui-tone";

/* ── Canal ───────────────────────────────────────────────────────────────── */

/** Colores del badge de cada canal: Farma turquesa, CORA violeta, Breve sus colores de marca. */
export const PEDIDO_CANAL_BADGE: Record<PedidoCanal, { color: BadgeColor; tone: UiTone }> = {
  FARMA: { color: "primary", tone: "socios" },
  CORA: { color: "primary", tone: "cora" },
  BREVE: { color: "breve", tone: "socios" },
};

export type PedidoCanalTab = PedidoCanal | "TODOS";

export const PEDIDO_CANAL_TAB_OPTIONS: { value: PedidoCanalTab; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "FARMA", label: PEDIDO_CANAL_LABELS.FARMA },
  { value: "BREVE", label: PEDIDO_CANAL_LABELS.BREVE },
  { value: "CORA", label: PEDIDO_CANAL_LABELS.CORA },
];

export type PedidoEstadoTone = "active" | "success" | "error";

export function formatPedidoFecha(fechaStr: string): string {
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return fechaStr;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export const getPedidoEstadoLabel = (idEstado: number): string =>
  PLEX_ESTADO_LABELS[idEstado] ?? `Estado ${idEstado}`;

export function getPedidoEstadoTone(idEstado: number): PedidoEstadoTone {
  if (idEstado === 2) return "error";
  if (idEstado === 7 || idEstado >= 8) return "success";
  return "active";
}

export const isPedidoRetiro = (pedido: PedidoNormalizado): boolean =>
  pedido.tipo_entrega.trim() === "R";

/** "Retiro en S. ANTONIOLLI III" / "Envío a domicilio". */
export function getPedidoEntregaLabel(pedido: PedidoNormalizado): string {
  if (isPedidoRetiro(pedido)) {
    return pedido.nombre_sucursal
      ? `Retiro en ${pedido.nombre_sucursal}`
      : "Retiro en sucursal";
  }
  return "Envío a domicilio";
}

/** "IBUPIRAC 400 MG y 2 productos más". */
export function getPedidoProductosResumen(pedido: PedidoNormalizado): string | null {
  const [primero, ...resto] = pedido.productos;
  if (!primero) return null;

  const nombre = primero.producto ?? "Producto";
  if (resto.length === 0) return nombre;
  return `${nombre} y ${resto.length} ${resto.length === 1 ? "producto más" : "productos más"}`;
}

export const getPedidoUnidades = (pedido: PedidoNormalizado): number =>
  pedido.productos.reduce((total, prod) => total + Number(prod.qty || 0), 0);

export function getPedidoTrackingSteps(pedido: PedidoNormalizado) {
  if (isPedidoRetiro(pedido)) {
    return [
      { label: "Pedido recibido", threshold: 1 },
      { label: "En preparación", threshold: 3 },
      { label: "Listo para retiro", threshold: 5 },
      { label: "Entregado", threshold: 7 },
    ];
  }
  return [
    { label: "Pedido recibido", threshold: 1 },
    { label: "En preparación", threshold: 3 },
    { label: "Listo para envío", threshold: 4 },
    { label: "En camino", threshold: 6 },
    { label: "Entregado", threshold: 7 },
  ];
}

export function isPedidoStepActive(threshold: number, idEstado: number): boolean {
  if (idEstado === 2) return false;
  if (idEstado >= 8) return true;
  return idEstado >= threshold;
}

/** Pasos del seguimiento listos para `<Timeline />` (un rechazo marca el primer paso). */
export function getPedidoTimelineSteps(pedido: PedidoNormalizado): TimelineStep[] {
  const isRechazado = pedido.id_estado === 2;

  return getPedidoTrackingSteps(pedido).map((step) => {
    if (isRechazado && step.threshold === 1) {
      return { key: step.threshold, label: step.label, state: "error", chip: "Rechazado" };
    }
    return {
      key: step.threshold,
      label: step.label,
      state: isPedidoStepActive(step.threshold, pedido.id_estado) ? "done" : "pending",
    };
  });
}

/** Agrupa pedidos (ya ordenados por fecha desc) por día, conservando el orden. */
export function groupPedidosPorFecha(pedidos: PedidoNormalizado[]) {
  const groups: { fecha: string; pedidos: PedidoNormalizado[] }[] = [];
  for (const pedido of pedidos) {
    const fecha = formatPedidoFecha(pedido.fecha);
    const last = groups[groups.length - 1];
    if (last && last.fecha === fecha) {
      last.pedidos.push(pedido);
    } else {
      groups.push({ fecha, pedidos: [pedido] });
    }
  }
  return groups;
}

/* ── Filtros de la lista ─────────────────────────────────────────────────── */

export type PedidoEstadoFilter = "todos" | "activos" | "entregados" | "rechazados";

export const PEDIDO_ESTADO_FILTERS: { value: PedidoEstadoFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "entregados", label: "Entregados" },
  { value: "rechazados", label: "Rechazados" },
];

export function matchesPedidoEstadoFilter(
  pedido: PedidoNormalizado,
  filter: PedidoEstadoFilter,
): boolean {
  if (filter === "todos") return true;
  const tone = getPedidoEstadoTone(pedido.id_estado);
  if (filter === "entregados") return tone === "success";
  if (filter === "rechazados") return tone === "error";
  return tone === "active";
}

/** Busca por número de pedido, sucursal o nombre de producto. */
export function matchesPedidoSearch(pedido: PedidoNormalizado, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    pedido.id_pedido.toLowerCase().includes(q) ||
    (pedido.nombre_sucursal?.toLowerCase().includes(q) ?? false) ||
    pedido.productos.some((prod) => prod.producto?.toLowerCase().includes(q) ?? false)
  );
}

/* ── Navegación ──────────────────────────────────────────────────────────── */

export const getPedidoHref = (idPedido: string) =>
  `/socios?view=pedidos&pedido=${encodeURIComponent(idPedido)}`;

export const PEDIDOS_LIST_HREF = "/socios?view=pedidos";
