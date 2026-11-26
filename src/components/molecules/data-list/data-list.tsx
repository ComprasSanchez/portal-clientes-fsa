import { toneClass, type UiTone } from "@/types/ui-tone";
import styles from "./data-list.module.scss";

type DataListProps = {
  items: Array<{ label: string; value: string }>;
  tone?: UiTone;
  className?: string;
};

/** Lista de datos "etiqueta: valor" (ej. nombre, DNI y email de una cuenta). */
export default function DataList({ items, tone = "socios", className }: DataListProps) {
  return (
    <dl className={`${styles.list} ${toneClass(tone)} ${className ?? ""}`}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
