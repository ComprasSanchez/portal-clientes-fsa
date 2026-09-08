"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { usePortalNotificacionesContext } from "@/lib/portal-notificaciones-context";
import { NotificationListItem } from "./NotificationListItem";

type NotificationBellProps = {
  /** Si viene, tocar la campana navega a la pantalla de notificaciones en vez de abrir el dropdown (uso mobile). */
  onOpenInbox?: () => void;
};

export function NotificationBell({ onOpenInbox }: NotificationBellProps) {
  const { notificaciones, unreadCount, isLoading, markAsRead } =
    usePortalNotificacionesContext();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (onOpenInbox) {
            onOpenInbox();
            return;
          }
          setOpen((prev) => !prev);
        }}
        className="relative rounded-lg p-2 text-[#6f7085] transition-colors hover:bg-[#f2f0f7]"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#dd3f62] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-[#e6e1ef] bg-white shadow-[0_16px_40px_rgba(47,48,66,0.18)]">
          <div className="border-b border-[#e6e1ef] px-4 py-3">
            <span className="text-sm font-semibold text-[#2f3042]">
              Notificaciones
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading && notificaciones.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-[#7d7e96]">
                Cargando...
              </p>
            )}

            {!isLoading && notificaciones.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-[#7d7e96]">
                No tenés notificaciones todavía.
              </p>
            )}

            {notificaciones.map((item) => (
              <NotificationListItem
                key={item.id}
                item={item}
                onMarkAsRead={markAsRead}
                onNavigateAway={() => setOpen(false)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
