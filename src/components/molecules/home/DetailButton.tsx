import { ArrowRight } from "lucide-react";
import styles from "./home-molecules.module.scss";

interface DetailButtonProps {
  onClick?: () => void;
  tone?: "cora" | "socios";
}

export function DetailButton({ onClick, tone = "cora" }: DetailButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${styles.detailButton} ${tone === "socios" ? styles.detailButtonSocios : ""}`}
      type="button"
    >
      Ver detalle
      <ArrowRight size={15} />
    </button>
  );
}
