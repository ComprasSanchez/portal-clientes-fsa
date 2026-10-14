"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import EmptyState from "@/components/molecules/empty-state/empty-state";
import PageTitlebar from "@/components/molecules/page-titlebar/page-titlebar";
import Pagination from "@/components/molecules/pagination/pagination";
import SearchInput from "@/components/molecules/search-input/search-input";
import SegmentedControl from "@/components/molecules/segmented-control/segmented-control";
import { PedidoListCard } from "@/components/molecules/socios/pedidos/lista/pedido-list-card/pedido-list-card";
import { PedidoListRow } from "@/components/molecules/socios/pedidos/lista/pedido-list-row/pedido-list-row";
import { PedidosFechaGroup } from "@/components/molecules/socios/pedidos/lista/pedidos-fecha-group/pedidos-fecha-group";
import { PedidosSkeleton } from "@/components/molecules/socios/pedidos/lista/pedidos-skeleton/pedidos-skeleton";
import { PedidoDetalleDrawer } from "@/components/molecules/socios/pedidos/detalle/pedido-detalle-drawer/pedido-detalle-drawer";
import { PedidoDetalleSkeleton } from "@/components/molecules/socios/pedidos/detalle/pedido-detalle-skeleton/pedido-detalle-skeleton";
import { usePortalPedido } from "@/lib/use-portal-pedido";
import { usePortalPedidos } from "@/lib/use-portal-pedidos";
import {
  groupPedidosPorFecha,
  matchesPedidoEstadoFilter,
  matchesPedidoSearch,
  PEDIDO_CANAL_TAB_OPTIONS,
  PEDIDO_ESTADO_FILTERS,
  PEDIDOS_LIST_HREF,
  type PedidoCanalTab,
  type PedidoEstadoFilter,
} from "@/lib/portal-pedidos";
import { PEDIDO_CANAL_LABELS } from "@/types/portal-pedidos";
import { SociosPedidoDetalle } from "./SociosPedidoDetalle";
import styles from "./SociosPedidosView.module.scss";

const PAGE_SIZE = 8;

export function SociosPedidosView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get("pedido");

  const [activeCanal, setActiveCanal] = useState<PedidoCanalTab>("TODOS");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<PedidoEstadoFilter>("todos");
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = usePortalPedidos({
    enabled: true,
    limit: 20,
    canal: activeCanal === "TODOS" ? undefined : activeCanal,
  });
  const detalle = usePortalPedido(pedidoId);

  // En escritorio el detalle reemplaza a la lista: llevar al inicio de la página.
  useEffect(() => {
    if (pedidoId && window.matchMedia("(min-width: 1024px)").matches) {
      window.scrollTo(0, 0);
    }
  }, [pedidoId]);

  const allPedidos = useMemo(() => data?.pedidos ?? [], [data]);

  const filteredPedidos = useMemo(
    () =>
      allPedidos.filter(
        (p) => matchesPedidoSearch(p, search) && matchesPedidoEstadoFilter(p, activeFilter),
      ),
    [allPedidos, search, activeFilter],
  );

  // Solo los filtros de estado que tienen algún pedido ("Todos" siempre).
  const estadoFilters = PEDIDO_ESTADO_FILTERS.filter(
    (f) => f.value === "todos" || allPedidos.some((p) => matchesPedidoEstadoFilter(p, f.value)),
  );

  const totalPages = Math.ceil(filteredPedidos.length / PAGE_SIZE);
  const pagedPedidos = filteredPedidos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const groups = groupPedidosPorFecha(pagedPedidos);

  const closeDetalle = () => router.push(PEDIDOS_LIST_HREF, { scroll: false });

  const titlebar = (
    <PageTitlebar
      title="Detalle del pedido"
      backLabel="Volver a mis pedidos"
      onBack={closeDetalle}
    />
  );

  const detalleBody = detalle.isLoading || (!detalle.pedido && isLoading) ? (
    <PedidoDetalleSkeleton />
  ) : detalle.pedido ? (
    <SociosPedidoDetalle pedido={detalle.pedido} />
  ) : detalle.notFound ? (
    <EmptyState
      icon={ShoppingBag}
      title="No encontramos este pedido"
      text="Revisá que el link sea correcto o volvé a tus pedidos."
    />
  ) : (
    <EmptyState
      icon={ShoppingBag}
      title="No pudimos cargar el pedido"
      text="Intentá nuevamente en unos minutos."
    />
  );

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      {/* Escritorio: vista completa del pedido (reemplaza a la lista) */}
      {pedidoId && (
        <div className="hidden flex-col gap-5 lg:flex">
          {titlebar}
          {detalleBody}
        </div>
      )}

      {/* Lista: en escritorio se oculta mientras se ve un pedido (conserva filtros y pestaña) */}
      <div className={`flex flex-col gap-5 lg:gap-6 ${pedidoId ? "lg:hidden" : ""}`}>
        <div>
          <h1 className={styles.pageTitle}>Mis pedidos</h1>
          <p className={styles.pageSubtitle}>
            Seguimiento del estado, preparación y entrega de tu pedido
          </p>
        </div>

        <SegmentedControl
          ariaLabel="Canal del pedido"
          options={PEDIDO_CANAL_TAB_OPTIONS}
          value={activeCanal}
          onChange={(canal) => {
            setActiveCanal(canal);
            setActiveFilter("todos");
            setPage(0);
          }}
        />

        {isLoading ? (
          <PedidosSkeleton />
        ) : error ? (
          <Alert>No pudimos cargar tus pedidos. Intenta nuevamente en unos minutos.</Alert>
        ) : allPedidos.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={
              activeCanal === "TODOS"
                ? "No hay pedidos registrados"
                : `No tenés pedidos de ${PEDIDO_CANAL_LABELS[activeCanal]}`
            }
            text={
              activeCanal === "TODOS"
                ? "Tus pedidos aparecerán aquí cuando realices una compra."
                : "Mostramos los pedidos de los últimos 6 meses."
            }
          />
        ) : (
          <div className="flex flex-col gap-3 lg:gap-4">
            {/* Buscador + filtros de estado */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <SearchInput
                className="lg:w-96"
                placeholder="Buscar por sucursal o producto..."
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(0);
                }}
              />
              {estadoFilters.length > 1 && (
                <SegmentedControl
                  variant="pills"
                  className="lg:shrink-0"
                  ariaLabel="Estado del pedido"
                  options={estadoFilters}
                  value={activeFilter}
                  onChange={(filter) => {
                    setActiveFilter(filter);
                    setPage(0);
                  }}
                />
              )}
            </div>

            {pagedPedidos.length === 0 ? (
              <p className="rounded-xl border border-[#d5e4e8] bg-white p-4 text-sm text-[#698088]">
                No se encontraron pedidos con ese criterio.
              </p>
            ) : (
              <>
                {/* Celular: tarjetas */}
                <div className="flex flex-col gap-2 lg:hidden">
                  {pagedPedidos.map((p) => (
                    <PedidoListCard key={p.id_pedido} pedido={p} />
                  ))}
                </div>

                {/* Escritorio: agrupado por día, estilo Mercado Libre */}
                <div className="hidden flex-col gap-4 lg:flex">
                  {groups.map((group) => (
                    <PedidosFechaGroup key={group.fecha} fecha={group.fecha}>
                      {group.pedidos.map((p) => (
                        <PedidoListRow key={p.id_pedido} pedido={p} />
                      ))}
                    </PedidosFechaGroup>
                  ))}
                </div>
              </>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(next) => {
                setPage(next);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}
      </div>

      {/* Celular: el detalle se abre en un cajón sobre la lista */}
      <PedidoDetalleDrawer open={Boolean(pedidoId)} header={titlebar}>
        {detalleBody}
      </PedidoDetalleDrawer>
    </div>
  );
}
