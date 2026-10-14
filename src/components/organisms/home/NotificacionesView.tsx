"use client";

import { useMemo, useState } from "react";
import { BellOff, ChevronRight } from "lucide-react";
import BackButton from "@/components/atoms/back-button/back-button";
import EmptyState from "@/components/molecules/empty-state/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortalNotificacionesContext } from "@/lib/portal-notificaciones-context";
import {
  NOTIFICATION_CATEGORIES,
  resolveNotificationCategory,
  type NotificationCategoryKey,
} from "@/lib/notification-categories";
import { NotificationListItem } from "@/components/molecules/side-bar/NotificationListItem";
import type { PortalNotificacionItem } from "@/types/portal-notificaciones";
import type { HomeView } from "@/types/home";
import styles from "./HomeViews.module.scss";

type NotificacionesViewProps = {
  onNavigate: (view: HomeView) => void;
  previousView?: HomeView;
};

export function NotificacionesView({
  onNavigate,
  previousView,
}: NotificacionesViewProps) {
  const { notificaciones, isLoading, markAsRead } =
    usePortalNotificacionesContext();
  const [selectedCategory, setSelectedCategory] =
    useState<NotificationCategoryKey | null>(null);

  const byCategory = useMemo(() => {
    const map = new Map<NotificationCategoryKey, PortalNotificacionItem[]>();
    for (const category of NOTIFICATION_CATEGORIES) {
      map.set(category.key, []);
    }
    for (const item of notificaciones) {
      map.get(resolveNotificationCategory(item.category))?.push(item);
    }
    return map;
  }, [notificaciones]);

  const selectedCategoryConfig = NOTIFICATION_CATEGORIES.find(
    (category) => category.key === selectedCategory,
  );

  if (selectedCategoryConfig) {
    const items = byCategory.get(selectedCategoryConfig.key) ?? [];

    return (
      <div>
        <div className="flex items-center gap-2">
          <BackButton tone="cora" ariaLabel="Volver a categorías" onClick={() => setSelectedCategory(null)} />
          <h1 className={styles.activeViewTitle}>
            {selectedCategoryConfig.label}
          </h1>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-[#e6e1ef]">
          {isLoading && items.length === 0 && (
            <div className="flex flex-col gap-2 p-4" aria-label="Cargando notificaciones">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg bg-[#f2eefa]" />
              ))}
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <EmptyState
              variant="plain"
              tone="cora"
              icon={BellOff}
              text="Sin novedades por ahora."
            />
          )}
          {items.map((item) => (
            <NotificationListItem
              key={item.id}
              item={item}
              onMarkAsRead={markAsRead}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <BackButton tone="cora" ariaLabel="Volver" onClick={() => onNavigate(previousView ?? "dashboard")} />
        <h1 className={styles.activeViewTitle}>Notificaciones</h1>
      </div>
      <p className={styles.activeViewDescription}>
        Todas tus novedades, organizadas por categoría.
      </p>

      <div className="mt-3 flex flex-col gap-3">
        {NOTIFICATION_CATEGORIES.map((category) => {
          const items = byCategory.get(category.key) ?? [];
          const unread = items.filter((item) => item.status !== "READ").length;
          const latest = items[0];
          const Icon = category.icon;

          return (
            <button
              key={category.key}
              type="button"
              onClick={() => setSelectedCategory(category.key)}
              className="flex items-center gap-3 rounded-xl border border-[#e6e1ef] bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-[#f8f7fc]"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${category.color}1a`, color: category.color }}
              >
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#2f3042]">
                    {category.label}
                  </span>
                  {unread > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#dd3f62] px-1 text-[10px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-[#7d7e96]">
                  {latest
                    ? (latest.title ?? latest.body ?? "Nueva novedad")
                    : "Sin novedades por ahora"}
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[#a3a4b8]" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
