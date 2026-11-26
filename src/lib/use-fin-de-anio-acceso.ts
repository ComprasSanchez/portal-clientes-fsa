"use client";

import { useEffect, useState } from "react";
import { isFinDeAnioVisible } from "@/lib/fin-de-anio";

// Si esta persona ve "Fin de año" (la lista de DNIs se controla en el servidor). Ante un error, no.
export function useFinDeAnioAcceso() {
  const activo = isFinDeAnioVisible();
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    if (!activo) return;
    let cancelado = false;
    fetch("/api/portal/me/fin-de-anio/acceso", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { visible: false }))
      .then((d: { visible?: boolean }) => !cancelado && setVisible(d.visible === true))
      .catch(() => !cancelado && setVisible(false));
    return () => {
      cancelado = true;
    };
  }, [activo]);

  return { verFinDeAnio: activo && visible === true, isLoading: activo && visible === null };
}
