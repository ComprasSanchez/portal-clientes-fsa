"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import {
  PLEX_ESTADO_LABELS,
  type PedidoNormalizado,
} from "@/types/portal-pedidos";
import { usePortalPedidos } from "@/lib/use-portal-pedidos";
import { formatPortalCurrency } from "@/lib/portal-compras";
import styles from "./SociosPedidosView.module.scss";

function formatFecha(fechaStr: string): string {
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return fechaStr;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getTrackingSteps(tipoEntrega: string) {
  if (tipoEntrega.trim() === "R") {
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

function isStepActive(threshold: number, idEstado: number): boolean {
  if (idEstado === 2) return false;
  if (idEstado >= 8) return true;
  return idEstado >= threshold;
}

function EstadoBadge({ idEstado }: { idEstado: number }) {
  const label = PLEX_ESTADO_LABELS[idEstado] ?? `Estado ${idEstado}`;
  const isRechazado = idEstado === 2;
  const isEntregado = idEstado === 7 || idEstado >= 8;

  return (
    <span
      className={`${styles.badge} ${styles.badgeMd} ${
        isRechazado
          ? styles.badgeError
          : isEntregado
            ? styles.badgeSuccess
            : styles.badgeActive
      }`}
    >
      {label}
    </span>
  );
}

function EstadoBadgeSm({ idEstado }: { idEstado: number }) {
  const label = PLEX_ESTADO_LABELS[idEstado] ?? `Estado ${idEstado}`;
  const isRechazado = idEstado === 2;
  const isEntregado = idEstado === 7 || idEstado >= 8;

  return (
    <span
      className={`${styles.badge} ${styles.badgeSm} ${
        isRechazado
          ? styles.badgeError
          : isEntregado
            ? styles.badgeSuccess
            : styles.badgeActive
      }`}
    >
      {label}
    </span>
  );
}

type FilterKey = "todos" | "activos" | "entregados" | "rechazados";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "activos", label: "Activos" },
  { key: "entregados", label: "Entregados" },
  { key: "rechazados", label: "Rechazados" },
];

function matchesFilter(p: PedidoNormalizado, f: FilterKey): boolean {
  if (f === "todos") return true;
  if (f === "entregados") return p.id_estado === 7 || p.id_estado >= 8;
  if (f === "rechazados") return p.id_estado === 2;
  return p.id_estado !== 2 && p.id_estado < 7;
}

// â”€â”€ Card de la lista izquierda â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PedidoListCard({
  pedido,
  isSelected,
  onClick,
}: {
  pedido: PedidoNormalizado;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isRetiro = pedido.tipo_entrega.trim() === "R";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.orderCard} ${isSelected ? styles.orderCardActive : ""}`}
    >
      <div className={styles.orderCardTopRow}>
        <p className={styles.orderCardId}>#{pedido.id_pedido}</p>
        <EstadoBadgeSm idEstado={pedido.id_estado} />
      </div>
      <p className={styles.orderCardDate}>{formatFecha(pedido.fecha)}</p>
      <div className={styles.orderCardBottomRow}>
        <div className={styles.orderCardMeta}>
          {isRetiro ? <MapPin size={13} /> : <Truck size={13} />}
          <span>
            {isRetiro
              ? (pedido.nombre_sucursal ?? "Retiro en sucursal")
              : "Envío a domicilio"}
          </span>
        </div>
        <span className={styles.orderCardAmount}>
          {formatPortalCurrency(pedido.importe)}
        </span>
      </div>
    </button>
  );
}

// â”€â”€ Panel de detalle derecho â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PedidoDetail({ pedido }: { pedido: PedidoNormalizado }) {
  const isRechazado = pedido.id_estado === 2;
  const isRetiro = pedido.tipo_entrega.trim() === "R";
  const trackingSteps = getTrackingSteps(pedido.tipo_entrega);

  return (
    <div className="flex flex-col gap-7 lg:gap-8">
      {/* Número + estado + fecha */}
      <div>
        <p className={styles.detailOrderLabel}>Número de orden</p>
        <p className={styles.detailOrderNumber}>#{pedido.id_pedido}</p>
        <div className={styles.detailMetaRow}>
          <EstadoBadge idEstado={pedido.id_estado} />
          <span className={styles.detailDate}>{formatFecha(pedido.fecha)}</span>
        </div>
      </div>

      {/* Seguimiento */}
      <div>
        <p className={styles.sectionLabel}>Seguimiento</p>
        <div className="flex flex-col">
          {trackingSteps.map((step, idx) => {
            const active = isStepActive(step.threshold, pedido.id_estado);
            const isFirst = step.threshold === 1;
            const isLast = idx === trackingSteps.length - 1;

            return (
              <div key={step.threshold} className={styles.trackingStep}>
                <div className={styles.stepIconCol}>
                  <div
                    className={`${styles.stepCircle} ${
                      active
                        ? styles.stepCircleActive
                        : isRechazado && isFirst
                          ? styles.stepCircleRejected
                          : ""
                    }`}
                  >
                    {isRechazado && isFirst ? (
                      <XCircle size={16} />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`${styles.stepConnector} ${active ? styles.stepConnectorActive : ""}`}
                      style={{ height: "32px" }}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <p
                    className={`${styles.stepLabel} ${
                      active
                        ? styles.stepLabelActive
                        : isRechazado && isFirst
                          ? styles.stepLabelRejected
                          : ""
                    }`}
                  >
                    {step.label}
                  </p>
                  {isRechazado && isFirst && (
                    <span className={styles.stepRechazadoChip}>Rechazado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Productos */}
      {pedido.productos.length > 0 && (
        <div>
          <p className={styles.sectionLabel}>Productos</p>
          <div className={styles.detailBox}>
            {pedido.productos.map((prod) => (
              <div key={prod.product_id} className={styles.detailBoxRow}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={styles.detailBoxValue}>
                      {prod.producto ?? "Producto"}
                    </p>
                    {prod.presentacion && (
                      <p className={styles.detailBoxLabel}>
                        {prod.presentacion}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-[#007c98]">
                    x{prod.qty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalle adicional */}
      {((!isRetiro && pedido.domicilio) ||
        (isRetiro && pedido.nombre_sucursal) ||
        pedido.referencia_pago ||
        pedido.observacion) && (
        <div>
          <p className={styles.sectionLabel}>Detalle</p>
          <div className={styles.detailBox}>
            {isRetiro && pedido.nombre_sucursal && (
              <div className={styles.detailBoxRow}>
                <div className="flex items-start gap-3">
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-[#007c98]"
                  />
                  <div>
                    <p className={styles.detailBoxLabel}>Sucursal de retiro</p>
                    <p className={styles.detailBoxValue}>
                      {pedido.nombre_sucursal}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {!isRetiro && pedido.domicilio && (
              <div className={styles.detailBoxRow}>
                <div className="flex items-start gap-3">
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-[#007c98]"
                  />
                  <div>
                    <p className={styles.detailBoxLabel}>
                      Dirección de entrega
                    </p>
                    <p className={styles.detailBoxValue}>{pedido.domicilio}</p>
                  </div>
                </div>
              </div>
            )}
            {pedido.referencia_pago && (
              <div className={styles.detailBoxRow}>
                <p className={styles.detailBoxLabel}>Referencia de pago</p>
                <p className={styles.detailBoxValue}>
                  {pedido.referencia_pago}
                </p>
              </div>
            )}
            {pedido.observacion && (
              <div className={styles.detailBoxRow}>
                <p className={styles.detailBoxLabel}>Observación</p>
                <p className={styles.detailBoxValue}>{pedido.observacion}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resumen */}
      <div>
        <p className={styles.sectionLabel}>Resumen del pedido</p>
        <div className={styles.summaryBox}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Total</span>
            <span className={styles.summaryAmount}>
              {formatPortalCurrency(pedido.importe)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PedidosSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr]">
      <div className="flex flex-col gap-2.5">
        <div className="h-11 animate-pulse rounded-xl bg-[#e6f7fb]/70" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-full bg-[#e6f7fb]/70"
            />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-22 animate-pulse rounded-xl bg-[#e6f7fb]/70"
          />
        ))}
      </div>
      <div className="h-130 animate-pulse rounded-2xl bg-[#e6f7fb]/70" />
    </div>
  );
}

// â”€â”€ Vista principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


export function SociosPedidosView() {
  const { data, isLoading, error } = usePortalPedidos({
    enabled: true,
    limit: 20,
  });
  const allPedidos = data?.pedidos ?? [];
  const total = data?.total ?? allPedidos.length;


  const PAGE_SIZE = 7;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos");
  const [page, setPage] = useState(0);

  const filteredPedidos = useMemo(() => {
    return allPedidos.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        p.id_pedido.toLowerCase().includes(q) ||
        (p.nombre_sucursal?.toLowerCase().includes(q) ?? false);
      return matchSearch && matchesFilter(p, activeFilter);
    });
  }, [allPedidos, search, activeFilter]);

  const totalPages = Math.ceil(filteredPedidos.length / PAGE_SIZE);
  const pagedPedidos = filteredPedidos.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const effectiveId =
    selectedId && pagedPedidos.some((p) => p.id_pedido === selectedId)
      ? selectedId
      : (pagedPedidos[0]?.id_pedido ?? null);

  const selectedPedido =
    pagedPedidos.find((p) => p.id_pedido === effectiveId) ?? null;

  const visibleFilters = FILTERS.filter(
    (f) => f.key === "todos" || allPedidos.some((p) => matchesFilter(p, f.key)),
  );

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Mis pedidos</h1>
          <p className={styles.pageSubtitle}>
            Seguimiento del estado, preparación y entrega de tu pedido
          </p>
        </div>
      </div>
      {isLoading ? (
        <PedidosSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          No pudimos cargar tus pedidos. Intenta nuevamente en unos minutos.
        </div>
      ) : allPedidos.length === 0 ? (
        <div className="rounded-2xl border border-[#d5e4e8] bg-white">
          <div className={styles.emptyPanel}>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f7fb]">
              <ShoppingBag size={28} className="text-[#007c98]/50" />
            </div>
            <p className={styles.emptyPanelTitle}>No hay pedidos registrados</p>
            <p className={styles.emptyPanelText}>
              Tus pedidos aparecerán aquí cuando realices una compra.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[400px_1fr] lg:items-start xl:grid-cols-[440px_1fr]">
            {/* Panel izquierdo: lista */}
            <div className="flex flex-col gap-3">
              {/* Buscador */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9bb3ba]"
                />
                <input
                  type="search"
                  placeholder="Buscar por número o sucursal..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                    setSelectedId(null);
                    setMobileDetailOpen(false);
                  }}
                  className={styles.searchInput}
                />
              </div>

              {/* Filtros */}
              {visibleFilters.length > 1 && (
                <div className={styles.filterBar}>
                  {visibleFilters.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => {
                        setActiveFilter(f.key);
                        setPage(0);
                        setSelectedId(null);
                        setMobileDetailOpen(false);
                      }}
                      className={`${styles.filterButton} ${
                        activeFilter === f.key ? styles.filterButtonActive : ""
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Lista de pedidos */}
              <div className="flex flex-col gap-2">
                {pagedPedidos.length === 0 ? (
                  <p className="rounded-xl border border-[#d5e4e8] bg-white p-4 text-sm text-[#698088]">
                    No se encontraron pedidos con ese criterio.
                  </p>
                ) : (
                  pagedPedidos.map((p) => (
                    <PedidoListCard
                      key={p.id_pedido}
                      pedido={p}
                      isSelected={p.id_pedido === effectiveId}
                      onClick={() => {
                        setSelectedId(p.id_pedido);
                        setMobileDetailOpen(true);
                      }}
                    />
                  ))
                )}
              </div>

              {/* PaginaciÃ³n */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => p - 1);
                      setSelectedId(null);
                    }}
                    disabled={page === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d5e4e8] bg-white text-[#32505a] transition-colors hover:bg-[#e6f7fb] disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setPage(i);
                          setSelectedId(null);
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                          i === page
                            ? "bg-[#007c98] text-white"
                            : "border border-[#d5e4e8] bg-white text-[#32505a] hover:bg-[#e6f7fb]"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => p + 1);
                      setSelectedId(null);
                    }}
                    disabled={page === totalPages - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d5e4e8] bg-white text-[#32505a] transition-colors hover:bg-[#e6f7fb] disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Panel derecho: detalle â€” solo visible en desktop */}
            <div className={styles.desktopDetailOnly}>
              <div className={styles.detailPanel}>
                {selectedPedido ? (
                  <PedidoDetail pedido={selectedPedido} />
                ) : (
                  <div className={styles.emptyPanel}>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f7fb]">
                      <ShoppingBag size={26} className="text-[#007c98]/45" />
                    </div>
                    <p className={styles.emptyPanelTitle}>
                      Seleccioná un pedido para ver el detalle
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drawer mobile: slide desde la derecha */}
          <AnimatePresence>
            {mobileDetailOpen && selectedPedido && (
              <motion.div
                className={styles.mobileDrawer}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  type: "tween",
                  ease: [0.32, 0.72, 0, 1],
                  duration: 0.3,
                }}
              >
                <div className={styles.mobileDrawerHeader}>
                  <button
                    type="button"
                    onClick={() => setMobileDetailOpen(false)}
                    className={styles.mobileDrawerBackBtn}
                    aria-label="Volver a la lista"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <span className={styles.mobileDrawerTitle}>
                    Detalle del pedido
                  </span>
                </div>
                <div className={styles.mobileDrawerContent}>
                  <PedidoDetail pedido={selectedPedido} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
