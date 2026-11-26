"use client";

import { useCallback, useEffect, useState } from "react";
import type { TourPapaNoel } from "@/types/portal-tour-papa-noel";

const CADA_MS = 60_000;

/** Recorrido de Papá Noel. Se actualiza cada minuto para que se lo vea avanzar. */
export function usePortalTourPapaNoel() {
  const [tour, setTour] = useState<TourPapaNoel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/me/tour-papa-noel", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setTour((await res.json()) as TourPapaNoel);
      setError(null);
    } catch {
      setError("No pudimos ver por dónde anda Papá Noel. Probá de nuevo en un rato.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), CADA_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { tour, isLoading, error, refresh };
}
