import React from "react";
import { Minus, PackageOpen, Plus, SearchX } from "lucide-react";
import BackButton from "@/components/atoms/back-button/back-button";
import EmptyState from "@/components/molecules/empty-state/empty-state";
import PortalStepper from "../../stepper/stepper";
import PedidoAccordion, {
  PedidoItem,
} from "../../pedido-accordion.tsx/pedido-accordion";
import SearchInput from "@/components/molecules/search-input/search-input";
import PortalButton from "@/components/atoms/button/button";
import Pagination from "@/components/molecules/pagination/pagination";
import type { Product } from "@/types/magic-link-type";
import PriceTag from "@/components/atoms/price-tag/price-tag";

type ProductosSubpaso = "revisar" | "agregar";

type PedidosStep1Props = {
  items: PedidoItem[];
  searchQuery: string;
  hasSearched: boolean;
  searchResults: Product[];
  searchLoading: boolean;
  currentPage: number;
  totalResults: number;
  pageSize: number;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onToggleItem: (id: string, checked: boolean) => void;
  onToggleProduct: (product: Product) => void;
  isProductSelected: (product: Product) => boolean;
  getProductQuantity: (id: string) => number;
  onChangeProductQuantity: (id: string, delta: number) => void;
  /** Pide la página `page` de la búsqueda (empieza en 1). */
  onPageChange: (page: number) => void;
  onContinue: () => void;
  onContactAdvisor: () => void;
  /**
   * Si está activo, separa "revisar tus productos habituales" y "agregar
   * más productos" en dos pantallas en vez de mostrar todo junto.
   */
  splitProductSteps?: boolean;
  /**
   * Controlado por el padre (no estado interno): así, al volver desde
   * "Coordinamos tu entrega", se puede reabrir directo en "agregar" en vez
   * de reiniciar siempre en "revisar".
   */
  subpaso: ProductosSubpaso;
  onSubpasoChange: (subpaso: ProductosSubpaso) => void;
};

const PedidosStep1 = ({
  items,
  searchQuery,
  hasSearched,
  searchResults,
  searchLoading,
  currentPage,
  totalResults,
  pageSize,
  onSearchChange,
  onSearch,
  onToggleItem,
  onToggleProduct,
  isProductSelected,
  getProductQuantity,
  onChangeProductQuantity,
  onPageChange,
  onContinue,
  onContactAdvisor,
  splitProductSteps = false,
  subpaso,
  onSubpasoChange,
}: PedidosStep1Props) => {
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const selectedCount = items.filter((item) => item.checked).length;
  const showAccordion = !splitProductSteps || subpaso === "revisar";
  const showSearch = !splitProductSteps || subpaso === "agregar";

  const searchSectionRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToSearchTop = () => {
    searchSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handlePageChange = (page: number) => {
    scrollToSearchTop();
    onPageChange(page);
  };

  return (
    <div>
      <div className="w-full p-5">
        <h4 className="flex items-center justify-center gap-2 pt-6 text-[#8C6FAF] text-bold text-[22px]">
          {splitProductSteps && subpaso === "agregar" && (
            <BackButton variant="boxed" tone="cora-portal" ariaLabel="Volver" onClick={() => onSubpasoChange("revisar")} />
          )}
          Preparación de tu pedido
        </h4>
        <PortalStepper currentStep={1} />

        {showAccordion && (
          <>
            <div className="flex flex-col">
              <p className="flex text-center items-center justify-center text-[#8C6FAF] text-bold text-[18px]">
                Estos son los productos que usás habitualmente:
              </p>
            </div>

            <div className="mx-auto py-6">
              {items.length > 0 ? (
                <PedidoAccordion items={items} onToggle={onToggleItem} />
              ) : (
                <EmptyState
                  tone="cora-portal"
                  icon={PackageOpen}
                  text="No hay productos seleccionados en este momento."
                />
              )}
            </div>
          </>
        )}

        <div className="flex flex-col gap-5" ref={searchSectionRef}>
          {showSearch && splitProductSteps && (
            <p className="text-center text-[#8C6FAF] text-bold text-[18px]">
              ¿Querés agregar más productos a tu pedido? Buscalos acá:
            </p>
          )}

          {showSearch && (
            <SearchInput
              tone="cora-portal"
              size="lg"
              leading="plus"
              ariaLabel="Buscá y agregá nuevos productos a tu carrito"
              placeholder="Buscar o agregar otro producto"
              value={searchQuery}
              onChange={onSearchChange}
              onSubmit={onSearch}
              showSubmitButton
              loading={searchLoading}
            />
          )}
          {showSearch && searchLoading && (
            <p className="text-center text-sm text-[#8C6FAF]">
              Buscando productos...
            </p>
          )}

          {showSearch && hasSearched && !searchLoading && searchResults.length === 0 && (
            <EmptyState
              tone="cora-portal"
              icon={SearchX}
              text="No encontramos productos para esa búsqueda."
            />
          )}

          {showSearch && searchResults.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {searchResults.map((product) => {
                const selected = isProductSelected(product);

                return (
                  <div
                    key={product.id}
                    className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#8C6FAF]/10"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-[#8C6FAF]">
                          {product.nombre}
                        </p>
                        <p className="text-sm text-[#8C6FAF]/80">{product.lab}</p>
                        {product.presentacion && (
                          <p className="text-xs text-[#8C6FAF]/60">
                            {product.presentacion}
                          </p>
                        )}
                        <div className="mt-1">
                          <PriceTag
                            precio={product.precio}
                            precioBase={product.precioBase}
                            descuentoPct={product.descuentoPct}
                          />
                        </div>
                      </div>

                      {/* <Search size={18} className="text-[#8C6FAF]/60" /> */}
                    </div>

                    {selected ? (
                      <div className="flex w-full items-center justify-between rounded-2xl border border-[#8C6FAF] px-4 py-2">
                        <button
                          type="button"
                          onClick={() => onChangeProductQuantity(product.id, -1)}
                          aria-label="Quitar una unidad"
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[#8C6FAF] transition hover:bg-[#8C6FAF]/10"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="min-w-8 text-center text-base font-bold text-[#8C6FAF]">
                          {getProductQuantity(product.id)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onChangeProductQuantity(product.id, 1)}
                          aria-label="Agregar una unidad"
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[#8C6FAF] transition hover:bg-[#8C6FAF]/10"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <PortalButton
                        variant="primary"
                        onClick={() => onToggleProduct(product)}
                      >
                        Agregar al pedido
                      </PortalButton>
                    )}
                  </div>
                );
              })}

              {/* La búsqueda pagina desde 1; Pagination desde 0. */}
              <Pagination
                className="sm:col-span-2"
                tone="cora-portal"
                page={currentPage - 1}
                totalPages={totalPages}
                onChange={(next) => handlePageChange(next + 1)}
                disabled={searchLoading}
                summary={`${totalResults} resultados`}
              />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <PortalButton
              variant="primary"
              onClick={
                splitProductSteps && subpaso === "revisar"
                  ? () => onSubpasoChange("agregar")
                  : onContinue
              }
              disabled={
                splitProductSteps && subpaso === "revisar"
                  ? false
                  : selectedCount === 0
              }
            >
              {splitProductSteps && subpaso === "revisar"
                ? "Continuar"
                : "Confirmar pedido"}
            </PortalButton>

            <PortalButton variant="secondary" withChatIcon onClick={onContactAdvisor}>
              Hablar con CORA
            </PortalButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidosStep1;