"use client";

import { useEffect, useState } from "react";

/** Segundos que faltan hasta `hastaMs` (epoch en ms); se actualiza cada segundo y queda en 0. */
export function useSegundosRestantes(hastaMs: number | undefined): number {
  const [ahora, setAhora] = useState(() => Date.now());
  const restantes = hastaMs ? Math.max(0, Math.ceil((hastaMs - ahora) / 1000)) : 0;

  useEffect(() => {
    if (restantes <= 0) return;
    // Si `ahora` quedó viejo (el destino cambió después de estar en 0), se pone
    // al día enseguida; si no, se actualiza cada segundo.
    const atraso = Date.now() - ahora;
    const t = window.setTimeout(() => setAhora(Date.now()), atraso > 1000 ? 0 : 1000);
    return () => window.clearTimeout(t);
  }, [restantes, ahora, hastaMs]);

  return restantes;
}
