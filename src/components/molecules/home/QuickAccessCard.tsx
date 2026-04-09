import { type LucideIcon } from "lucide-react";
import { type HomeView } from "@/types/home";
import styles from "./home-molecules.module.scss";

export interface QuickAccessItem {
  label: string;
  view: HomeView;
  icon: LucideIcon;
}

interface QuickAccessCardProps {
  item: QuickAccessItem;
  onNavigate: (view: HomeView) => void;
}

export function QuickAccessCard({ item, onNavigate }: QuickAccessCardProps) {
  const Icon = item.icon;

  return (
    <button className={styles.quickAccessCard} onClick={() => onNavigate(item.view)}>
      <span className={styles.quickAccessIconWrap}>
        <Icon size={20} />
      </span>
      <p className={styles.quickAccessLabel}>{item.label}</p>
    </button>
  );
}
