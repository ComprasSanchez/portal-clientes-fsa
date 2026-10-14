"use client";

import { useMemo, useState } from "react";
import { BellOff } from "lucide-react";
import BackButton from "@/components/atoms/back-button/back-button";
import EmptyState from "@/components/molecules/empty-state/empty-state";
import { NotificationCategoryRow } from "@/components/molecules/notification-category-row/notification-category-row";
import { NotificationListItem } from "@/components/molecules/side-bar/NotificationListItem";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getNotificacionPreview,
  groupNotificacionesPorCategoria,
  NOTIFICATION_CATEGORIES,
  type NotificationCategoryKey,
} from "@/lib/notification-categories";
import { usePortalNotificacionesContext } from "@/lib/portal-notificaciones-context";
import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./NotificacionesView.module.scss";

type NotificacionesViewProps = {
  /** Volver a la vista anterior (cada app decide a dónde). */
  onBack: () => void;
  /** Colores y tipografía: Socios o CORA. */
  tone?: Extract<UiTone, "socios" | "cora">;
};

/** Bandeja de notificaciones agrupadas por categoría. La usan Socios y CORA. */
export function NotificacionesView({ onBack, tone = "cora" }: NotificacionesViewProps) {
  const { notificaciones, isLoading, markAsRead } = usePortalNotificacionesContext();
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategoryKey | null>(null);

  const byCategory = useMemo(
    () => groupNotificacionesPorCategoria(notificaciones),
    [notificaciones],
  );

  const selectedCategoryConfig = NOTIFICATION_CATEGORIES.find(
    (category) => category.key === selectedCategory,
  );
  const rootClass = `${styles[tone]} ${toneClass(tone)}`;

  if (selectedCategoryConfig) {
    const items = byCategory.get(selectedCategoryConfig.key) ?? [];

    return (
      <div className={rootClass}>
        <div className={styles.header}>
          <BackButton
            tone={tone}
            ariaLabel="Volver a categorías"
            onClick={() => setSelectedCategory(null)}
          />
          <h1 className={styles.title}>{selectedCategoryConfig.label}</h1>
        </div>

        <div className={styles.list}>
          {isLoading && items.length === 0 && (
            <div className="flex flex-col gap-2 p-4" aria-label="Cargando notificaciones">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg bg-(--tone-soft)" />
              ))}
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <EmptyState
              variant="plain"
              tone={tone}
              icon={BellOff}
              text="Sin novedades por ahora."
            />
          )}
          {items.map((item) => (
            <NotificationListItem
              key={item.id}
              item={item}
              tone={tone}
              onMarkAsRead={markAsRead}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div className={styles.header}>
        <BackButton tone={tone} ariaLabel="Volver" onClick={onBack} />
        <h1 className={styles.title}>Notificaciones</h1>
      </div>
      <p className={styles.description}>Todas tus novedades, organizadas por categoría.</p>

      <div className={styles.categories}>
        {NOTIFICATION_CATEGORIES.map((category) => {
          const items = byCategory.get(category.key) ?? [];
          return (
            <NotificationCategoryRow
              key={category.key}
              tone={tone}
              label={category.label}
              icon={category.icon}
              color={category.color}
              unread={items.filter((item) => item.status !== "READ").length}
              preview={getNotificacionPreview(items)}
              onClick={() => setSelectedCategory(category.key)}
            />
          );
        })}
      </div>
    </div>
  );
}
