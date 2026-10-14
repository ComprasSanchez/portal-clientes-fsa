import { Skeleton } from "@/components/ui/skeleton";

const BLOCK = "bg-[#e6f7fb]/70";

/** Placeholder de carga de la lista de pedidos. */
export function PedidosSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className={`h-11 rounded-xl lg:max-w-md ${BLOCK}`} />
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className={`h-22 rounded-xl lg:h-32 ${BLOCK}`} />
      ))}
    </div>
  );
}
