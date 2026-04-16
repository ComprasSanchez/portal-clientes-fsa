import { Skeleton } from "@/components/ui/skeleton";

type ThemeVariant = "cora" | "socios";

const themeCardClass: Record<ThemeVariant, string> = {
  cora: "border-[#e7e2f0] bg-white shadow-[0_10px_35px_rgba(37,24,78,0.06)]",
  socios: "border-[#d5e4e8] bg-white shadow-[0_12px_32px_rgba(0,68,84,0.06)]",
};

const themeAccentClass: Record<ThemeVariant, string> = {
  cora: "bg-[#f7f1fd]",
  socios: "bg-[linear-gradient(135deg,#007c98_0%,#0e6277_100%)]",
};

type ContainerProps = {
  variant?: ThemeVariant;
  children: React.ReactNode;
};

const SkeletonCard = ({ variant = "cora", children }: ContainerProps) => (
  <article
    className={`rounded-3xl border p-6 ${themeCardClass[variant]}`}
    aria-hidden="true"
  >
    {children}
  </article>
);

export function ProfileViewSkeleton({ variant = "cora" }: { variant?: ThemeVariant }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>

      <SkeletonCard variant={variant}>
        <div className="grid gap-6 xl:grid-cols-[8rem_1fr]">
          <div className="flex items-start gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
          </div>

          <div className="space-y-6">
            <Skeleton className="h-10 w-72 max-w-full" />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <Skeleton className="h-7 w-48" />
                <div className="grid gap-4">
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
              </div>

              <div className="space-y-4">
                <Skeleton className="h-7 w-52" />
                <div className="grid gap-4">
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="my-6 h-px bg-[#efe9f6]" />

        <div className={`flex items-center justify-between gap-4 rounded-2xl p-5 ${themeAccentClass[variant]}`}>
          <div className="space-y-3 w-full max-w-md">
            <Skeleton className={`h-4 w-40 ${variant === "socios" ? "bg-white/20" : "bg-[#e3d8f6]"}`} />
            <Skeleton className={`h-8 w-64 max-w-full ${variant === "socios" ? "bg-white/25" : "bg-[#d7c2f5]"}`} />
            {variant === "socios" ? (
              <Skeleton className="h-10 w-44 bg-white/20" />
            ) : null}
          </div>
          <Skeleton className={`h-10 w-10 rounded-full ${variant === "socios" ? "bg-white/20" : "bg-[#dccbf5]"}`} />
        </div>
      </SkeletonCard>
    </section>
  );
}

export function TrackingViewSkeleton({ variant = "cora" }: { variant?: ThemeVariant }) {
  return (
    <section className="space-y-6" aria-hidden="true">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-64 max-w-full" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      <SkeletonCard variant={variant}>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-8 w-44 rounded-full" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </div>
      </SkeletonCard>
    </section>
  );
}

export function ExpedienteViewSkeleton({ variant = "cora" }: { variant?: ThemeVariant }) {
  return (
    <section className="space-y-6" aria-hidden="true">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-64 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SkeletonCard variant={variant}>
          <Skeleton className="h-4 w-28" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </SkeletonCard>

        <SkeletonCard variant={variant}>
          <Skeleton className="h-4 w-32" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </SkeletonCard>

        <SkeletonCard variant={variant}>
          <Skeleton className="h-4 w-36" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>

          <div className="mt-5 grid gap-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </SkeletonCard>
      </div>

      <Skeleton className="h-11 w-40 rounded-xl" />
    </section>
  );
}