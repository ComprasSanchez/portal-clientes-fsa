import { Megaphone, Package, Percent, ShoppingBag, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  color: string;
};

export const NOTIFICATION_CATEGORIES: NotificationCategoryConfig[] = [
  { key: "CORA", label: "CORA", icon: Package, color: "#8f63d9" },
  { key: "SOCIOSA", label: "SocioSA", icon: Users, color: "#007c98" },
  {
    key: "PROMOCIONES",
    label: "Promociones y sorteos",
    icon: Percent,
    color: "#dd3f62",
  },
  { key: "BREVE", label: "Breve", icon: Megaphone, color: "#2f3042" },
  { key: "FARMA", label: "FARMA", icon: ShoppingBag, color: "#1f9d55" },
];

const DEFAULT_NOTIFICATION_CATEGORY: NotificationCategoryKey = "CORA";

/** Las notificaciones despachadas antes de este campo no traen `category` — hoy CORA es el único productor real. */
export const resolveNotificationCategory = (
  category: string | undefined,
): NotificationCategoryKey => {
  const match = NOTIFICATION_CATEGORIES.find((c) => c.key === category);
  return match ? match.key : DEFAULT_NOTIFICATION_CATEGORY;
};
