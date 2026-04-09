"use client";

import { useState } from "react";
import { Poppins } from "next/font/google";
import { HomeViews } from "@/components/organisms/home/HomeViews";
import { Sidebar } from "@/components/organisms/home/Sidebar";
import { HomeView } from "@/types/home";

const DEFAULT_VIEW: HomeView = "dashboard";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const HomePage = () => {
  const [currentView, setCurrentView] = useState<HomeView>(DEFAULT_VIEW);

  const handleLogout = () => {
    setCurrentView(DEFAULT_VIEW);
  };

  return (
    <div className={`${poppins.className} min-h-screen bg-linear-to-br from-muted/30 to-white`}>
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        userName="Usuario"
      />

      <div className="pt-16 transition-all duration-300 lg:ml-64 lg:pt-0">
        <HomeViews currentView={currentView} onNavigate={setCurrentView} />

        <footer className="mt-auto border-t border-border bg-white py-6">
          <div className="max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
            <p className="mb-2">© 2026 CORA - Todos los derechos reservados</p>
            <p className="text-xs">Empatia · Claridad · Cercania</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
