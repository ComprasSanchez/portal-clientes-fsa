"use client";

import { MessageCircle } from "lucide-react";
import styles from "./button.module.scss";

type PortalButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary";
  onClick?: () => void;
  disabled?: boolean;
  withChatIcon?: boolean;
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
      className={`${styles.button} ${
        variant === "primary" ? styles.primary : styles.secondary
      }`}
    >
      {withChatIcon && <MessageCircle size={22} className={styles.icon} />}
      <span>{children}</span>
    </button>
  );
}
