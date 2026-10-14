import { Skeleton } from "@/components/ui/skeleton";

const BLOCK = "rounded-2xl bg-[#e6f7fb]/70";

/** Placeholder de carga de la vista completa de un pedido. */
export function PedidoDetalleSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className={`h-32 ${BLOCK}`} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className={`h-80 ${BLOCK}`} />
        <Skeleton className={`h-48 ${BLOCK}`} />
      </div>
    </div>
  );
}
