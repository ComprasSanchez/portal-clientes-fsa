"use client";

import { Files, Home, Menu, Plus, User } from "lucide-react";
import { type HomeView } from "@/types/home";

interface BottomNavBarProps {
  currentView: HomeView;
  onNavigate: (view: HomeView) => void;
  onMoreClick: () => void;
}

const sideItems: Array<{
  id: HomeView;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: "dashboard", label: "Inicio", icon: Home },
  { id: "mi-historial", label: "Historial", icon: Files },
];

const trailingItems: Array<{
  id: HomeView;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [{ id: "mi-cuenta", label: "Perfil", icon: User }];

export function BottomNavBar({
  currentView,
  onNavigate,
  onMoreClick,
}: BottomNavBarProps) {
  const isCreatingOrder = currentView === "crear-pedido";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-[#e6e1ef] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navegacion principal"
    >
      {sideItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <div
            key={item.id}
            className="flex min-w-0 flex-1 items-center justify-center"
          >
            <button
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex min-w-0 flex-col items-center gap-1 px-1 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive ? "text-[#8f63d9]" : "text-[#7d7e96]"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          </div>
        );
      })}

      <div className="flex min-w-0 flex-1 items-center justify-center">
        <button
          type="button"
          onClick={() => onNavigate("crear-pedido")}
          aria-label="Crear nuevo pedido"
          className={`relative -top-5 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full text-white shadow-[0_6px_16px_rgba(143,99,217,0.45)] ring-4 ring-white transition ${
            isCreatingOrder ? "bg-[#7f56c7]" : "bg-[#8f63d9]"
          }`}
        >
          <Plus size={26} />
        </button>
      </div>

      {trailingItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <div
            key={item.id}
            className="flex min-w-0 flex-1 items-center justify-center"
          >
            <button
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex min-w-0 flex-col items-center gap-1 px-1 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive ? "text-[#8f63d9]" : "text-[#7d7e96]"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          </div>
        );
      })}

      <div className="flex min-w-0 flex-1 items-center justify-center">
        <button
          type="button"
          onClick={onMoreClick}
          className="flex min-w-0 flex-col items-center gap-1 px-1 py-1 text-xs font-semibold whitespace-nowrap text-[#7d7e96] transition-colors"
        >
          <Menu size={20} />
          Más
        </button>
      </div>
    </nav>
  );
}
