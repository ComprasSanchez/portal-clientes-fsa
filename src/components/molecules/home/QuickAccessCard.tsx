import { type LucideIcon } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import { type HomeView } from "@/types/home";
import styles from "./home-molecules.module.scss";

export interface QuickAccessItem<TView extends string = HomeView> {
  label: string;
  view?: TView;
  icon: LucideIcon | StaticImageData;
  onClick?: () => void;
  tone?: "cora" | "socios" | "plain";
}

interface QuickAccessCardProps<TView extends string> {
  item: QuickAccessItem<TView>;
  onNavigate?: (view: TView) => void;
}

export function QuickAccessCard<TView extends string>({ item, onNavigate }: QuickAccessCardProps<TView>) {
  const Icon = item.icon;
  const isSociosTone = item.tone === "socios";
  const isPlainTone = item.tone === "plain";
  const iconSize = isPlainTone ? 44 : 20;

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
      className={`${styles.quickAccessCard} ${isSociosTone ? styles.quickAccessCardSocios : ""} cursor-pointer`}
      onClick={handleClick}
      type="button"
    >
      <span
        className={`${styles.quickAccessIconWrap} ${isSociosTone ? styles.quickAccessIconWrapSocios : ""} ${isPlainTone ? styles.quickAccessIconWrapPlain : ""}`}
      >
        {"src" in Icon ? (
          <Image src={Icon} alt="" width={iconSize} height={iconSize} />
        ) : (
          <Icon size={iconSize} />
        )}
      </span>
      <p className={`${styles.quickAccessLabel} ${isPlainTone ? styles.quickAccessLabelPlain : ""}`}>
        {item.label}
      </p>
    </button>
  );
}
