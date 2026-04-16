"use client";

import { useState } from "react";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";
import { SociosSidebar } from "@/components/molecules/side-bar/SociosSidebar";
import { SociosViews } from "@/components/organisms/socios/SociosViews";
import { usePortalPerfilContext } from "@/lib/portal-perfil-context";
import { type SociosView } from "@/types/socios";

const DEFAULT_VIEW: SociosView = "dashboard";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SociosPage = () => {
  const [currentView, setCurrentView] = useState<SociosView>(DEFAULT_VIEW);
  const router = useRouter();
  const { perfil, summary, isLoading } = usePortalPerfilContext();

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
    <div className={`${poppins.className} min-h-screen bg-linear-to-br from-[#edf1f2] via-[#f7f9fa] to-white`}>
      <SociosSidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        userName={summary.displayName}
      />

      <div className="flex min-h-[calc(100vh-4rem)] flex-col pt-16 transition-all duration-300 lg:ml-64 lg:min-h-screen lg:pt-0">
        <SociosViews
          currentView={currentView}
          onNavigate={setCurrentView}
          userName={summary.displayName}
          affiliateNumber={summary.affiliateNumber}
          documentNumber={summary.documentNumber}
          email={summary.email}
          phone={summary.phone}
          perfil={perfil}
          isProfileLoading={isLoading}
        />

        <footer className="relative left-1/2 mt-auto -translate-x-1/2 border-t border-[#d3dee2] bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-[#627880] sm:px-6 lg:px-8">
            <p className="mb-2">© 2026 Socios A - Todos los derechos reservados</p>
            <p className="text-xs text-[#8a9aa0]">Atencion clara · Gestion simple · Acceso rapido</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SociosPage;