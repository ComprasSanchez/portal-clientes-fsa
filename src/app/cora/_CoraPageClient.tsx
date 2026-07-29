"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HomeViews } from "@/components/organisms/home/HomeViews";
import { CoraDashboardSkeleton } from "@/components/organisms/loading/ViewSkeletons";
import { Sidebar } from "@/components/molecules/side-bar/Sidebar";
import { usePortalPerfilContext } from "@/lib/portal-perfil-context";
import { HomeView } from "@/types/home";

const DEFAULT_VIEW: HomeView = "dashboard";
const VALID_VIEWS: HomeView[] = [
  "dashboard",
  "mi-cuenta",
  "mis-pedidos",
  "productos",
  "pedidos",
  "facturas",
  "pedido-actual",
  "pedido-completo",
  "preguntas-frecuentes",
];

const HomeViewsFallback = () => {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CoraDashboardSkeleton />
    </main>
  );
};

export function CoraPageClient() {
  const [currentView, setCurrentView] = useState<HomeView>(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view && VALID_VIEWS.includes(view as HomeView)) {
      return view as HomeView;
    }
    return DEFAULT_VIEW;
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { perfil, summary, isLoading } = usePortalPerfilContext();

  useEffect(() => {
    const view = searchParams.get("view");
    if (view && VALID_VIEWS.includes(view as HomeView)) {
      setCurrentView(view as HomeView);
    } else if (!view) {
      setCurrentView(DEFAULT_VIEW);
    }
  }, [searchParams]);

  const handleNavigate = (view: HomeView) => {
    setCurrentView(view);
    const url = view === DEFAULT_VIEW ? "/cora" : `/cora?view=${view}`;
    router.push(url, { scroll: false });
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    void (async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
        });
      } finally {
        setCurrentView(DEFAULT_VIEW);
        router.replace("/");
      }
    })();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-muted/30 to-white">
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        userName={summary.displayName}
      />

      <div className="flex min-h-[calc(100vh-4rem)] flex-col pt-16 transition-all duration-300 lg:ml-64 lg:min-h-screen lg:pt-0">
        <Suspense fallback={<HomeViewsFallback />}>
          <HomeViews
            currentView={currentView}
            onNavigate={handleNavigate}
            userName={summary.displayName}
            affiliateNumber={summary.affiliateNumber}
            documentNumber={summary.documentNumber}
            email={summary.email}
            phone={summary.phone}
            perfil={perfil}
            isProfileLoading={isLoading}
          />
        </Suspense>

        <footer className="relative left-1/2 mt-auto -translate-x-1/2 border-t border-border bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
            <p className="mb-2">© 2026 CORA - Todos los derechos reservados</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
