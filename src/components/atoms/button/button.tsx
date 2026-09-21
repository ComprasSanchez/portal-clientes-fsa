"use client";

import Image from "next/image";
import { MessageCircle } from "lucide-react";
import styles from "./button.module.scss";

type PortalButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "mercadopago";
  onClick?: () => void;
  disabled?: boolean;
  withChatIcon?: boolean;
};

const VARIANT_STYLES = {
  primary: styles.primary,
  secondary: styles.secondary,
  mercadopago: styles.mercadopago,
};

export default function PortalButton({
  children,
  type = "button",
  variant = "primary",
  onClick,
  disabled = false,
  withChatIcon = false,
}: PortalButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${VARIANT_STYLES[variant]}`}
    >
      {withChatIcon && <MessageCircle size={22} className={styles.icon} />}
      {variant === "mercadopago" && (
        <Image
          src="/mercadopago-icon.svg"
          alt=""
          width={22}
          height={22}
          className={styles.icon}
        />
      )}
      <span>{children}</span>
    </button>
  );
}
