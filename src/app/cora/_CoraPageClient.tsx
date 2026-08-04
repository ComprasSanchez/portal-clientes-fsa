"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HomeViews } from "@/components/organisms/home/HomeViews";
import { CoraDashboardSkeleton } from "@/components/organisms/loading/ViewSkeletons";
import { Sidebar } from "@/components/molecules/side-bar/Sidebar";
import { BottomNavBar } from "@/components/molecules/side-bar/BottomNavBar";
import { usePortalPerfilContext } from "@/lib/portal-perfil-context";
import { HomeView } from "@/types/home";

const DEFAULT_VIEW: HomeView = "dashboard";
const VALID_VIEWS: HomeView[] = [
  "dashboard",
  "mi-cuenta",
  "mi-historial",
  "productos",
  "pedidos",
  "facturas",
  "pedido-actual",
  "pedido-completo",
  "preguntas-frecuentes",
  "crear-pedido",
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
  const previousViewRef = useRef<HomeView>(DEFAULT_VIEW);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const view = searchParams.get("view");
    if (view && VALID_VIEWS.includes(view as HomeView)) {
      setCurrentView(view as HomeView);
    } else if (!view) {
      setCurrentView(DEFAULT_VIEW);
    }
  }, [searchParams]);

  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty(
        "--app-vh",
        `${window.innerHeight}px`,
      );
    };

    setAppHeight();
    window.addEventListener("resize", setAppHeight);
    window.addEventListener("orientationchange", setAppHeight);

    return () => {
      window.removeEventListener("resize", setAppHeight);
      window.removeEventListener("orientationchange", setAppHeight);
    };
  }, []);

  const handleNavigate = (view: HomeView) => {
    previousViewRef.current = currentView;
    setCurrentView(view);
    setIsMobileMenuOpen(false);
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
    <div className="min-h-[var(--app-vh,100dvh)] bg-linear-to-br from-muted/30 to-white">
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        userName={summary.displayName}
        isMobileOpen={isMobileMenuOpen}
        onMobileOpenChange={setIsMobileMenuOpen}
      />

      <div className="flex min-h-[calc(var(--app-vh,100dvh)_-_8rem)] flex-col pt-16 pb-16 transition-all duration-300 lg:ml-64 lg:min-h-[var(--app-vh,100dvh)] lg:pt-0 lg:pb-0">
        <Suspense fallback={<HomeViewsFallback />}>
          <HomeViews
            currentView={currentView}
            previousView={previousViewRef.current}
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

        <footer className="relative left-1/2 mt-auto -translate-x-1/2 border-t border-border bg-white py-3">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
            <p>© 2026 CORA - Todos los derechos reservados</p>
          </div>
        </footer>
      </div>

      <BottomNavBar
        currentView={currentView}
        onNavigate={handleNavigate}
        onMoreClick={() => setIsMobileMenuOpen(true)}
      />
    </div>
  );
}
