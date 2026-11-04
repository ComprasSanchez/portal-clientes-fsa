import { sendGAEvent } from "@next/third-parties/google";

/** ID de medición de Google Analytics 4 (G-XXXX). Sin setear, GA no se carga. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

// Nunca mandar datos personales (DNI, email, nombre, teléfono) en los parámetros.
type AnalyticsParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, params: AnalyticsParams = {}) {
  if (!GA_ID || typeof window === "undefined") return;
  try {
    sendGAEvent("event", name, params);
  } catch {
    // La analítica nunca debe romper la página.
  }
}
