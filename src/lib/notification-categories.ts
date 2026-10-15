import { Package, Percent, ShoppingBag, ShoppingCart, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BadgeColor } from "@/components/atoms/badge/badge";
import type { PortalNotificacionItem } from "@/types/portal-notificaciones";
import type { UiTone } from "@/types/ui-tone";

export type NotificationCategoryKey =
  | "CORA"
  | "SOCIOSA"
  | "PROMOCIONES"
  | "BREVE"
  | "FARMA";

export type NotificationCategoryConfig = {
  key: NotificationCategoryKey;
  label: string;
  icon: LucideIcon;
  /** Color del ícono. */
  color: string;
  /** Fondo del círculo del ícono. Sin valor: el mismo `color` translúcido. */
  iconBackground?: string;
  /** Etiqueta de la categoría en listados mezclados (campana de escritorio). */
  badge: { color: BadgeColor; tone: UiTone };
};

export const NOTIFICATION_CATEGORIES: NotificationCategoryConfig[] = [
  {
    key: "CORA",
    label: "CORA",
    icon: Package,
    color: "#8f63d9",
    badge: { color: "primary", tone: "cora" },
  },
  {
    key: "SOCIOSA",
    label: "SocioSA",
    icon: Users,
    color: "#007c98",
    badge: { color: "primary", tone: "socios" },
  },
  {
    key: "PROMOCIONES",
    label: "Promociones y sorteos",
    icon: Percent,
    color: "#dd3f62",
    badge: { color: "danger", tone: "socios" },
  },
  {
    // Colores de marca Breve: amarillo sobre negro (igual que en "Mis pedidos").
    key: "BREVE",
    label: "Breve",
    icon: ShoppingCart,
    color: "#f4bc05",
    iconBackground: "#282828",
    badge: { color: "breve", tone: "socios" },
  },
  {
    key: "FARMA",
    label: "FARMA",
    icon: ShoppingBag,
    color: "#1f9d55",
    badge: { color: "success", tone: "socios" },
  },
];

export const getNotificationCategoryConfig = (
  category: string | undefined,
): NotificationCategoryConfig =>
  NOTIFICATION_CATEGORIES.find((c) => c.key === resolveNotificationCategory(category)) ??
  NOTIFICATION_CATEGORIES[0];

const DEFAULT_NOTIFICATION_CATEGORY: NotificationCategoryKey = "CORA";

/** Las notificaciones despachadas antes de este campo no traen `category` — hoy CORA es el único productor real. */
export const resolveNotificationCategory = (
  category: string | undefined,
): NotificationCategoryKey => {
  const match = NOTIFICATION_CATEGORIES.find((c) => c.key === category);
  return match ? match.key : DEFAULT_NOTIFICATION_CATEGORY;
};

/** Agrupa las notificaciones por categoría (todas las categorías presentes, aunque estén vacías). */
export function groupNotificacionesPorCategoria(
  notificaciones: PortalNotificacionItem[],
): Map<NotificationCategoryKey, PortalNotificacionItem[]> {
  const map = new Map<NotificationCategoryKey, PortalNotificacionItem[]>();
  for (const category of NOTIFICATION_CATEGORIES) {
    map.set(category.key, []);
  }
  for (const item of notificaciones) {
    map.get(resolveNotificationCategory(item.category))?.push(item);
  }
  return map;
}

/** Texto de la última novedad de una categoría para mostrar de vista previa. */
export const getNotificacionPreview = (items: PortalNotificacionItem[]): string => {
  const latest = items[0];
  return latest ? (latest.title ?? latest.body ?? "Nueva novedad") : "Sin novedades por ahora";
};
