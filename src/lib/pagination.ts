export type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

/**
 * Números de página a mostrar (0-based) con "…" cuando hay muchas:
 * siempre la primera y la última, más `siblings` páginas a cada lado de la actual.
 * Ej. página 5 de 20 → [0, "ellipsis-start", 4, 5, 6, "ellipsis-end", 19]
 */
export function getPaginationItems(
  page: number,
  totalPages: number,
  siblings = 1,
): PaginationItem[] {
  // first + last + current + 2*siblings + 2 ellipsis
  const maxWithoutEllipsis = 2 * siblings + 5;
  if (totalPages <= maxWithoutEllipsis) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const start = Math.max(1, page - siblings);
  const end = Math.min(totalPages - 2, page + siblings);
  const items: PaginationItem[] = [0];

  if (start > 1) items.push("ellipsis-start");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < totalPages - 2) items.push("ellipsis-end");

  items.push(totalPages - 1);
  return items;
}
