"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Gift,
  LayoutGrid,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { type SociosView } from "@/types/socios";
import sociosaLogo from "@/assets/sociosa-color.png";

interface SociosSidebarProps {
  currentView: SociosView;
  onNavigate: (view: SociosView) => void;
  userName: string;
  onLogout: () => void;
}

const menuItems: Array<{
  id: SociosView | "cora";
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: "dashboard", label: "Inicio", icon: LayoutGrid },
  { id: "facturas", label: "Facturas", icon: CreditCard },
  { id: "puntos", label: "Puntos", icon: Gift },
  { id: "cora", label: "CORA", icon: ChevronRight },
];

export function SociosSidebar({ currentView, onNavigate, userName, onLogout }: SociosSidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNavigate = (view: SociosView | "cora") => {
    if (view === "cora") {
      router.push("/home");
      return;
    }

    onNavigate(view);
    setIsMobileOpen(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-[#d3dee2] bg-[#f2f5f6] px-4 lg:hidden">
        <Image src={sociosaLogo} alt="Socios A" width={140} height={40} className="h-9 w-auto" priority />
        <button
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="rounded-lg p-2 text-[#32505a] transition-colors hover:bg-[#e0eaed]"
          aria-label="Abrir menu lateral"
          type="button"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/45 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside
        className={`fixed left-0 z-40 h-full border-r border-[#d3dee2] bg-[#f2f5f6] transition-all duration-300
          ${isCollapsed ? "w-20" : "w-64"}
          lg:top-0
          ${isMobileOpen ? "top-16" : "top-16 -translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-full flex-col">
          <div className="hidden border-b border-[#d3dee2] p-4 lg:block">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="overflow-hidden">
                <Image
                  src={sociosaLogo}
                  alt="Socios A"
                  width={140}
                  height={40}
                  className={`w-auto shrink-0 ${isCollapsed ? "h-8" : "h-10"}`}
                  priority
                />
              </div>
              <button
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="rounded-lg p-1 text-[#48636b] transition-colors hover:bg-[#dde8eb]"
                aria-label="Colapsar menu"
                type="button"
              >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            </div>
          </div>

          <div className="border-b border-[#d3dee2] p-4 lg:hidden">
            <div className="text-sm">
              <p className="text-[#6b8087]">Hola,</p>
              <p className="truncate font-medium text-[#17343d]">{userName}</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.id !== "cora" && currentView === item.id;

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavigate(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all
                        ${
                          isActive
                            ? "bg-linear-to-r from-[#007c98] to-[#0a6c84] text-white shadow-[0_8px_18px_rgba(0,124,152,0.22)]"
                            : "text-[#17343d] hover:bg-[#e2ecef]"
                        }`}
                      title={isCollapsed ? item.label : undefined}
                      type="button"
                    >
                      <Icon size={18} className="shrink-0" />
                      {!isCollapsed && <span className="text-[15px] font-semibold">{item.label}</span>}
                      {isCollapsed && <span className="text-[15px] font-semibold lg:hidden">{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-[#d3dee2] p-3">
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[#dd3f62] transition-colors hover:bg-[#fff0c2]"
              title={isCollapsed ? "Cerrar sesion" : undefined}
              type="button"
            >
              <LogOut size={20} className="shrink-0" />
              {!isCollapsed && <span className="text-sm font-semibold">Cerrar sesion</span>}
              {isCollapsed && <span className="text-sm font-semibold lg:hidden">Cerrar sesion</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}