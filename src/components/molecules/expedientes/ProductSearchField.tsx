"use client";

import { useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useGlobalToast } from "@/components/ui/global-toast";
import type {
  PortalProductoOption,
  PortalProductosResponse,
  SelectedProductState,
} from "@/types/portal-productos";
import { Label } from "@heroui/react";

const PAGE_SIZE = 5;

const normalizeProductResult = (
  value: Record<string, unknown>,
): PortalProductoOption => ({
  id: String(value.id ?? value.productoIdOrSkuExt ?? ""),
  nombre: String(value.nombre ?? value.productoNombre ?? "Producto sin nombre"),
  laboratorio: String(value.lab ?? value.marcaNombre ?? "Laboratorio sin dato"),
  presentacion:
    typeof value.presentacion === "string" ? value.presentacion : undefined,
});

interface ProductSearchFieldProps {
  selectedProducts: SelectedProductState[];
  onAdd: (product: PortalProductoOption) => void;
  onRemove: (productId: string) => void;
  error?: string;
}

export function ProductSearchField({
  selectedProducts,
  onAdd,
  onRemove,
  error,
}: ProductSearchFieldProps) {
  const { pushToast } = useGlobalToast();
  const [productQuery, setProductQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [productResults, setProductResults] = useState<PortalProductoOption[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const requestIdRef = useRef(0);

  const runSearch = async (term: string, targetPage: number) => {
    const requestId = ++requestIdRef.current;

    if (!term) {
      setHasSearched(true);
      setProductResults([]);
      setTotalPages(null);
      setTotalCount(null);
      return;
    }

    try {
      setIsSearching(true);
      const params = new URLSearchParams({
        busqueda: term,
        paginanro: String(targetPage),
        paginacant: String(PAGE_SIZE),
      });
      const response = await fetch(
        `/api/portal/me/productos?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const data = (await response.json().catch(() => null)) as
        | PortalProductosResponse
        | {
            error?: string;
            message?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(
          (data && "message" in data && data.message) ||
            (data && "error" in data && data.error) ||
            "No pudimos buscar productos.",
        );
      }

      if (requestIdRef.current !== requestId) {
        return;
      }

      const responsePayload =
        data && "data" in data ? (data as PortalProductosResponse) : null;

      const rawList = Array.isArray(responsePayload?.data)
        ? responsePayload.data
        : responsePayload?.data
          ? [responsePayload.data]
          : [];

      const normalized = rawList
        .filter((item: unknown): item is Record<string, unknown> =>
          Boolean(item && typeof item === "object"),
        )
        .map(normalizeProductResult)
        .filter((item: PortalProductoOption) => item.id.trim().length > 0);

      const meta = responsePayload?.meta;

      setProductResults(normalized);
      setCommittedQuery(term);
      setPage(targetPage);
      setHasSearched(true);
      setTotalCount(typeof meta?.total === "number" ? meta.total : null);
      setTotalPages(
        typeof meta?.totpaginas === "number"
          ? meta.totpaginas
          : typeof meta?.total === "number"
            ? Math.max(1, Math.ceil(meta.total / PAGE_SIZE))
            : normalized.length < PAGE_SIZE
              ? targetPage
              : null,
      );
    } catch (searchError) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setProductResults([]);
      setHasSearched(true);
      setTotalPages(null);
      setTotalCount(null);
      pushToast({
        title: "No pudimos buscar productos",
        description:
          searchError instanceof Error
            ? searchError.message
            : "Ocurrió un error inesperado.",
        variant: "error",
      });
    } finally {
      if (requestIdRef.current === requestId) {
        setIsSearching(false);
      }
    }
  };

  const handleSearchClick = () => {
    void runSearch(productQuery.trim(), 1);
  };

  const handleClearSearch = () => {
    requestIdRef.current += 1;
    setIsSearching(false);
    setProductQuery("");
    setCommittedQuery("");
    setProductResults([]);
    setHasSearched(false);
    setPage(1);
    setTotalPages(null);
    setTotalCount(null);
  };

  const canGoPrev = page > 1 && !isSearching;
  const canGoNext =
    (totalPages != null
      ? page < totalPages
      : productResults.length === PAGE_SIZE) && !isSearching;

  const addableResults = productResults.filter(
    (product) => !selectedProducts.some((item) => item.id === product.id),
  );

  return (
    <div className="text-sm text-[#5f6074] sm:rounded-2xl sm:border sm:border-dashed sm:border-[#ddd6eb] sm:bg-[#faf8fd] sm:p-4 md:col-span-2">
      <div className="flex flex-col gap-4">
        <p>Buscador de productos</p>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <input
              className="w-full rounded-2xl border border-[#ddd6eb] px-4 py-3 pr-10 text-sm outline-none transition focus:border-[#8f63d9]"
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearchClick();
                }
              }}
              placeholder="Buscá productos para sumar al pedido"
            />
            {productQuery.length > 0 || hasSearched ? (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f7fa0] transition hover:text-[#8f63d9]"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            disabled={isSearching}
            onClick={handleSearchClick}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#d8ccef] px-4 py-3 text-sm font-semibold text-[#6c48b4] transition hover:bg-[#f7f2ff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSearching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
          </button>
        </div>

        <div>
          {selectedProducts.length > 0 && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f63d9]">
              Productos seleccionados ({selectedProducts.length})
            </p>
          )}

          {selectedProducts.length > 0 ? (
            <div className="grid gap-3">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border-l-4 border-l-[#8f63d9] border-y border-r border-[#e2daf3] bg-white p-4"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f0e9fb] text-[#8f63d9]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <div>
                      <p className="font-semibold text-[#2f3042]">
                        {product.nombre}
                      </p>
                      <p className="text-xs text-[#6f7085]">
                        Laboratorio: {product.laboratorio}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(product.id)}
                    className="shrink-0 rounded-xl border border-[#f0dde2] px-3 py-2 text-xs font-semibold text-[#b03c55] transition hover:bg-[#fff4f6]"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm font-medium text-[#b03c55]">{error}</p>
        ) : null}

        {hasSearched ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7fa0]">
              Resultados de búsqueda
            </p>

            {isSearching ? (
              <div className="flex items-center gap-2 rounded-2xl border border-[#e9e1f6] bg-white p-4 text-sm text-[#6c48b4]">
                <Loader2 size={16} className="animate-spin" />
                Buscando productos...
              </div>
            ) : productResults.length === 0 ? (
              <p className="text-sm text-[#5f6074]">
                No encontramos productos para esa búsqueda.
              </p>
            ) : (
              <>
                {addableResults.length === 0 ? (
                  <p className="text-sm text-[#5f6074]">
                    Ya agregaste todos los productos de esta página.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {addableResults.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[#e9e1f6] bg-white p-4"
                      >
                        <div>
                          <p className="font-semibold text-[#2f3042]">
                            {product.nombre}
                          </p>
                          <p className="text-xs text-[#6f7085]">
                            {product.laboratorio}
                            {product.presentacion
                              ? ` · ${product.presentacion}`
                              : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAdd(product)}
                          className="rounded-xl bg-[#8f63d9] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#7f56c7]"
                        >
                          Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#eee6fb] pt-3">
                  <button
                    type="button"
                    disabled={!canGoPrev}
                    onClick={() => void runSearch(committedQuery, page - 1)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#ddd6eb] px-3 py-2 text-xs font-semibold text-[#6c48b4] transition hover:bg-[#f7f2ff] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                    Anterior
                  </button>
                  <span className="text-xs text-[#8f7fa0]">
                    {totalPages != null
                      ? `Página ${page} de ${totalPages}`
                      : `Página ${page}`}
                    {totalCount != null ? ` · ${totalCount} resultados` : ""}
                  </span>
                  <button
                    type="button"
                    disabled={!canGoNext}
                    onClick={() => void runSearch(committedQuery, page + 1)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#ddd6eb] px-3 py-2 text-xs font-semibold text-[#6c48b4] transition hover:bg-[#f7f2ff] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                    <ChevronRight size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
