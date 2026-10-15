"use client";

import { ChevronRight } from "lucide-react";
import Badge from "@/components/atoms/badge/badge";
import { getNotificationCategoryConfig } from "@/lib/notification-categories";
import { toneClass, type UiTone } from "@/types/ui-tone";
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
  tone?: UiTone;
  /** Muestra la etiqueta de la categoría (Breve, CORA...) — para listados que mezclan categorías. */
  showCategory?: boolean;
};

export function NotificationListItem({
  item,
  onMarkAsRead,
  onNavigateAway,
  tone = "cora",
  showCategory = false,
}: NotificationListItemProps) {
  const isUnread = item.status !== "READ";
  const category = showCategory ? getNotificationCategoryConfig(item.category) : null;

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
      className={`${toneClass(tone)} flex w-full flex-col gap-1 border-b border-(--tone-soft) px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-(--tone-soft-hover) ${
        isUnread ? "bg-(--tone-soft-hover)" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-(--tone-primary)" />}
        <span className="flex-1 text-sm font-semibold text-(--tone-text)">
          {item.title ?? "Notificación"}
        </span>
        {item.actionUrl && (
          <ChevronRight size={16} className="shrink-0 text-(--tone-primary)" />
        )}
      </div>
      {item.body && <span className="text-sm text-(--tone-muted)">{item.body}</span>}
      <div className="flex items-center gap-2">
        {category && (
          <Badge color={category.badge.color} tone={category.badge.tone}>
            {category.label}
          </Badge>
        )}
        <span className="text-xs text-(--tone-placeholder)">
          {formatRelativeTime(item.createdAt)}
        </span>
      </div>
    </button>
  );
}
