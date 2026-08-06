import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import styles from "./home-molecules.module.scss";

interface ProfileDataRowProps {
  icon: LucideIcon;
  value: string;
  label: string;
  status?: "verified" | "pending";
  onClick?: () => void;
}

export function ProfileDataRow({
  icon: Icon,
  value,
  label,
  status,
  onClick,
}: ProfileDataRowProps) {
  const content = (
    <>
      <Icon size={20} className={styles.dataRowIcon} />
      <div className={styles.dataRowText}>
        <p className={styles.dataRowValue}>{value}</p>
        <p className={styles.dataRowLabel}>{label}</p>
      </div>
      {status === "verified" ? (
        <CheckCircle2 size={18} className={styles.dataRowStatusVerified} />
      ) : status === "pending" ? (
        <AlertCircle size={18} className={styles.dataRowStatusPending} />
      ) : null}
      {onClick ? (
        <ChevronRight size={18} className={styles.dataRowChevron} />
      ) : null}
    </>
  );

  if (!onClick) {
    return <div className={styles.dataRow}>{content}</div>;
  }

  return (
    <button type="button" className={styles.dataRow} onClick={onClick}>
      {content}
    </button>
  );
}
