"use client";

import { ChevronRight } from "lucide-react";
import type { PortalNotificacionItem } from "@/types/portal-notificaciones";

export const formatRelativeTime = (iso: string): string => {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return "recién";
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;

  const diffDays = Math.round(diffHours / 24);
  return `hace ${diffDays} d`;
};

type NotificationListItemProps = {
  item: PortalNotificacionItem;
  onMarkAsRead: (id: string) => void;
  /** Se llama antes de navegar por `actionUrl` (ej. cerrar el dropdown de desktop). */
  onNavigateAway?: () => void;
};

export function NotificationListItem({
  item,
  onMarkAsRead,
  onNavigateAway,
}: NotificationListItemProps) {
  const isUnread = item.status !== "READ";

  return (
    <button
      type="button"
      onClick={() => {
        if (isUnread) onMarkAsRead(item.id);
        if (item.actionUrl) {
          onNavigateAway?.();
          window.location.href = item.actionUrl;
        }
      }}
      className={`flex w-full flex-col gap-1 border-b border-[#f2f0f7] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#f8f7fc] ${
        isUnread ? "bg-[#f5f0fc]" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        {isUnread && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#8f63d9]" />
        )}
        <span className="flex-1 text-sm font-semibold text-[#2f3042]">
          {item.title ?? "Notificación"}
        </span>
        {item.actionUrl && (
          <ChevronRight size={16} className="shrink-0 text-[#8f63d9]" />
        )}
      </div>
      {item.body && (
        <span className="text-sm text-[#6f7085]">{item.body}</span>
      )}
      <span className="text-xs text-[#a3a4b8]">
        {formatRelativeTime(item.createdAt)}
      </span>
    </button>
  );
}
