import { ArrowRight } from "lucide-react";
import styles from "./home-molecules.module.scss";

interface DetailButtonProps {
  onClick?: () => void;
}

export function DetailButton({ onClick }: DetailButtonProps) {
  return (
    <button onClick={onClick} className={styles.detailButton}>
      Ver detalle
      <ArrowRight size={15} />
    </button>
  );
}
