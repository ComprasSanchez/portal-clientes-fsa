"use client";

import { useState } from "react";
import PortalButton from "@/components/atoms/button/button";
import type { ExternalHandoffSystem } from "@/lib/external-systems";

type HandoffResponse = {
  ok: boolean;
  redirect_to?: string;
};

export function useExternalHandoff(externalSystem: ExternalHandoffSystem) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v2/auth/external-handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ external_system: externalSystem }),
      });
      const data: HandoffResponse = await res.json().catch(() => ({ ok: false }));

      if (res.ok && data.ok && data.redirect_to) {
        window.location.assign(data.redirect_to);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleClick };
}

type ExternalSystemHandoffButtonProps = {
  externalSystem: ExternalHandoffSystem;
  label: string;
};

export function ExternalSystemHandoffButton({
  externalSystem,
  label,
}: ExternalSystemHandoffButtonProps) {
  const { loading, handleClick } = useExternalHandoff(externalSystem);

  return (
    <PortalButton type="button" onClick={handleClick} disabled={loading}>
      {loading ? "Ingresando..." : label}
    </PortalButton>
  );
}
