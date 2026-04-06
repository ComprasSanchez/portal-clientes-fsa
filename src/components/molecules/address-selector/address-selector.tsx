"use client";

import * as React from "react";
import { House, Check } from "lucide-react";
import styles from "./addressSelector.module.scss";

export type AddressItem = {
  id: string;
  direccion: string;
  detalle?: string;
};

type AddressSelectorProps = {
  title?: string;
  items: AddressItem[];
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
};

export default function AddressSelector({
  items,
  selectedId,
  defaultSelectedId,
  onSelect,
}: AddressSelectorProps) {
  const [internalSelectedId, setInternalSelectedId] = React.useState<
    string | undefined
  >(defaultSelectedId);

  const currentSelectedId = selectedId ?? internalSelectedId;

  const handleSelect = (id: string) => {
    if (selectedId === undefined) {
      setInternalSelectedId(id);
    }

    onSelect?.(id);
  };

  return (
    <div className={styles.wrapper}>

      <div className={styles.list}>
        {items.map((item) => {
          const isSelected = currentSelectedId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.card} ${isSelected ? styles.selected : ""}`}
              onClick={() => handleSelect(item.id)}
              aria-pressed={isSelected}
            >
              <div className={styles.left}>
                <div className={styles.iconBox}>
                  <House size={22} className={styles.icon} />
                </div>

                <div className={styles.texts}>
                  <p className={styles.address}>{item.direccion}</p>

                  {item.detalle && (
                    <p className={styles.detail}>{item.detalle}</p>
                  )}
                </div>
              </div>

              <div className={styles.right}>
                <span
                  className={`${styles.radio} ${
                    isSelected ? styles.radioSelected : ""
                  }`}
                >
                  {isSelected && <Check size={14} strokeWidth={3} />}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}