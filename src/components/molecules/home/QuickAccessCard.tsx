import { type LucideIcon } from "lucide-react";
import { type HomeView } from "@/types/home";
import styles from "./home-molecules.module.scss";

export interface QuickAccessItem<TView extends string = HomeView> {
  label: string;
  view?: TView;
  icon: LucideIcon;
  onClick?: () => void;
  tone?: "cora" | "socios";
}

interface QuickAccessCardProps<TView extends string> {
  item: QuickAccessItem<TView>;
  onNavigate?: (view: TView) => void;
}

export function QuickAccessCard<TView extends string>({ item, onNavigate }: QuickAccessCardProps<TView>) {
  const Icon = item.icon;
  const isSociosTone = item.tone === "socios";

  const handleClick = () => {
    if (item.onClick) {
      item.onClick();
      return;
    }

    if (item.view && onNavigate) {
      onNavigate(item.view);
    }
  };

  return (
    <button
      className={`${styles.quickAccessCard} ${isSociosTone ? styles.quickAccessCardSocios : ""}`}
      onClick={handleClick}
      type="button"
    >
      <span className={`${styles.quickAccessIconWrap} ${isSociosTone ? styles.quickAccessIconWrapSocios : ""}`}>
        <Icon size={20} />
      </span>
      <p className={styles.quickAccessLabel}>{item.label}</p>
    </button>
  );
}
