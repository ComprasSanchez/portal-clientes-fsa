import React from "react";
import { Search } from "lucide-react";
import PortalStepper from "../../stepper/stepper";
import PedidoAccordion, {
  PedidoItem,
} from "../../pedido-accordion.tsx/pedido-accordion";
import PortalInput from "../../portal-input/input";
import PortalButton from "@/components/atoms/button/button";
import type { Product } from "@/types/magic-link-type";

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
  onPrevPage: () => void;
  onNextPage: () => void;
  onContinue: () => void;
  onContactAdvisor: () => void;
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
  onPrevPage,
  onNextPage,
  onContinue,
  onContactAdvisor,
}: PedidosStep1Props) => {
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const selectedCount = items.filter((item) => item.checked).length;

  return (
    <div>
      <div className="w-full p-5">
        <h4 className="flex items-center justify-center pt-6 text-[#8C6FAF] text-bold text-[22px]">
          Preparación de tu pedido
        </h4>
        <PortalStepper currentStep={1} />
        <div className="flex flex-col">
          <p className="flex text-center items-center justify-center text-[#8C6FAF] text-bold text-[18px]">
            Estos son los productos que usás habitualmente:
          </p>
        </div>

        <div className="max-w-105 mx-auto py-6">
          {items.length > 0 ? (
            <PedidoAccordion items={items} onToggle={onToggleItem} />
          ) : (
            <div className="rounded-3xl bg-white p-6 text-center text-[#8C6FAF] shadow-sm">
              No hay productos seleccionados en este momento.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <PortalInput
            label="Buscar producto"
            variant="add-product"
            value={searchQuery}
            onChange={onSearchChange}
            onSearchClick={onSearch}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch();
              }
            }}
          />

          <p
            style={{
              color: "#8C6FAF",
              fontSize: "0.95rem",
              fontWeight: 500,
              margin: "14px 0 20px",
            }}
          >
            Buscá y agregá nuevos productos a tu carrito
          </p>

          {searchLoading && (
            <p className="text-center text-sm text-[#8C6FAF]">
              Buscando productos...
            </p>
          )}

          {hasSearched && !searchLoading && searchResults.length === 0 && (
            <div className="rounded-3xl bg-white p-5 text-center text-[#8C6FAF] shadow-sm">
              No encontramos productos para esa búsqueda.
            </div>
          )}

          {searchResults.length > 0 && (
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
                      </div>

                      <Search size={18} className="text-[#8C6FAF]/60" />
                    </div>

                    <PortalButton
                      variant={selected ? "secondary" : "primary"}
                      onClick={() => onToggleProduct(product)}
                    >
                      {selected ? "Quitar del pedido" : "Agregar al pedido"}
                    </PortalButton>
                  </div>
                );
              })}

              <div className="sm:col-span-2 flex items-center justify-between rounded-3xl bg-white p-4 text-sm text-[#8C6FAF] shadow-sm">
                <p>
                  Página {currentPage} de {totalPages} ({totalResults} resultados)
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-[#8C6FAF] px-4 py-2 disabled:opacity-50"
                    onClick={onPrevPage}
                    disabled={currentPage <= 1 || searchLoading}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[#8C6FAF] px-4 py-2 disabled:opacity-50"
                    onClick={onNextPage}
                    disabled={currentPage >= totalPages || searchLoading}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <PortalButton
              variant="primary"
              onClick={onContinue}
              disabled={selectedCount === 0}
            >
              Confirmar pedido
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