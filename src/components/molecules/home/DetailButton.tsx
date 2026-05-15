import { ArrowRight } from "lucide-react";
import styles from "./home-molecules.module.scss";

interface DetailButtonProps {
  onClick?: () => void;
  tone?: "cora" | "socios";
  label?: string;
}

export function DetailButton({ onClick, tone = "cora", label = "Ver detalle" }: DetailButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${styles.detailButton} ${tone === "socios" ? styles.detailButtonSocios : ""}`}
      type="button"
    >
      {label}
      <ArrowRight size={15} />
    </button>
  );
}
