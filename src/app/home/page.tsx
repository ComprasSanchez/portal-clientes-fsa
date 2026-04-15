"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HomeViews } from "@/components/organisms/home/HomeViews";
import { Sidebar } from "@/components/molecules/side-bar/Sidebar";
import { usePortalPerfilContext } from "@/lib/portal-perfil-context";
import { HomeView } from "@/types/home";

const DEFAULT_VIEW: HomeView = "dashboard";

const HomePage = () => {
  const [currentView, setCurrentView] = useState<HomeView>(DEFAULT_VIEW);
  const router = useRouter();
  const { perfil, summary } = usePortalPerfilContext();

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
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        userName={summary.displayName}
      />

      <div className="flex min-h-[calc(100vh-4rem)] flex-col pt-16 transition-all duration-300 lg:ml-64 lg:min-h-screen lg:pt-0">
        <HomeViews
          currentView={currentView}
          onNavigate={setCurrentView}
          userName={summary.displayName}
          affiliateNumber={summary.affiliateNumber}
          documentNumber={summary.documentNumber}
          email={summary.email}
          phone={summary.phone}
          perfil={perfil}
        />

        <footer className="relative left-1/2 mt-auto -translate-x-1/2 border-t border-border bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
            <p className="mb-2">© 2026 CORA - Todos los derechos reservados</p>
            <p className="text-xs">Empatia · Claridad · Cercania</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
