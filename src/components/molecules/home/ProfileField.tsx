import styles from "./home-molecules.module.scss";

interface ProfileFieldProps {
  label: string;
  value: string;
  isEditing?: boolean;
  onChange?: (value: string) => void;
  type?: "text" | "email" | "tel";
  readOnly?: boolean;
}

export function ProfileField({
  label,
  value,
  isEditing = false,
  onChange,
  type = "text",
  readOnly = false,
}: ProfileFieldProps) {
  return (
    <div className={styles.profileField}>
      <p className={styles.profileFieldLabel}>{label}</p>

      {isEditing && !readOnly ? (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className={styles.profileFieldInput}
        />
      ) : (
        <p className={styles.profileFieldValue}>{value}</p>
      )}
    </div>
  );
}
