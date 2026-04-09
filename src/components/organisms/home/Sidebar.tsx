"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { type HomeView } from "@/types/home";

interface SidebarProps {
  currentView: HomeView;
  onNavigate: (view: HomeView) => void;
  userName: string;
  onLogout: () => void;
}

const menuItems: Array<{
  id: HomeView;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: "dashboard", label: "Inicio", icon: Home },
  { id: "mi-cuenta", label: "Mi perfil", icon: User },
  { id: "productos", label: "Productos", icon: ShoppingBag },
  { id: "pedidos", label: "Mis pedidos", icon: Package },
  { id: "facturas", label: "Facturas", icon: CreditCard },
  { id: "expediente-actual", label: "Expediente actual", icon: FileText },
  {
    id: "expediente-completo",
    label: "Historial completo",
    icon: TrendingUp,
  },
];

export function Sidebar({
  currentView,
  onNavigate,
  userName,
  onLogout,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNavigate = (view: HomeView) => {
    onNavigate(view);
    setIsMobileOpen(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-border bg-white px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-[#2a2a3b]">Portal Clientes</span>
        </div>
        <button
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="rounded-lg p-2 text-[#6f7085] transition-colors hover:bg-[#f2f0f7]"
          aria-label="Abrir menu lateral"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 z-40 h-full border-r border-[#e6e1ef] bg-[#f8f7fc] transition-all duration-300
          ${isCollapsed ? "w-20" : "w-64"}
          lg:top-0
          ${isMobileOpen ? "top-16" : "top-16 -translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-full flex-col">
          <div className="hidden border-b border-[#e6e1ef] p-4 lg:block">
            <div className="mb-4 flex items-center justify-between">
              {!isCollapsed && (
                <span className="text-sm font-semibold uppercase tracking-wide text-[#8b8ca4]">
                  Navegacion
                </span>
              )}
              <button
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="rounded-lg p-1 text-[#7d7e96] transition-colors hover:bg-[#ece7f6]"
                aria-label="Colapsar menu"
              >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            </div>

            {!isCollapsed && (
              <div className="text-sm">
                <p className="text-[#8b8ca4]">Hola,</p>
                <p className="truncate font-medium text-[#2c2d40]">{userName}</p>
              </div>
            )}
          </div>

          <div className="border-b border-[#e6e1ef] p-4 lg:hidden">
            <div className="text-sm">
              <p className="text-[#8b8ca4]">Hola,</p>
              <p className="truncate font-medium text-[#2c2d40]">{userName}</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavigate(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all
                        ${
                          isActive
                            ? "bg-linear-to-r from-[#8f63d9] to-[#9f74e5] text-white shadow-[0_6px_16px_rgba(143,99,217,0.3)]"
                            : "text-[#2f3042] hover:bg-[#ede8f8]"
                        }`}
                      title={isCollapsed ? item.label : undefined}
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

          <div className="border-t border-[#e6e1ef] p-3">
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[#dd3f62] transition-colors hover:bg-[#fdecef]"
              title={isCollapsed ? "Cerrar sesion" : undefined}
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
