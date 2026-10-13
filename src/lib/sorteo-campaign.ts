import type { StaticImageData } from "next/image";
import sorteoCardImg from "@/assets/sociosa-img/sorteo-mobile.jpeg";
import sorteoSectionImg from "@/assets/sociosa-img/seccion-sorteo.jpeg";
import { SORTEO_BREVE_ENABLED } from "@/lib/feature-flags";

/** Campaña de sorteo armada desde el portal (no viene del CRM). Se muestra
 * solo si su flag está prendido Y estamos entre `startsAt` y `endsAt`. Fuera de
 * eso, el portal vuelve al comportamiento normal: sorteo activo del CRM +
 * botón "Participar". */
export type SorteoCampaign = {
  enabled: boolean;
  startsAt: string;
  endsAt: string;
  card: {
    image: StaticImageData;
    imageAlt: string;
    title: string;
    description: string[];
  };
  section: {
    image: StaticImageData;
    imageAlt: string;
  };
  /** Solo para sorteos donde se participa comprando (sin botón). */
  purchaseParticipation?: {
    storeName: string;
    storeAddress: string;
    periodLabel: string;
    frequencyLabel: string;
  };
  instagram?: {
    handle: string;
    url: string;
  };
};

const BREVE_OCTUBRE_2026: SorteoCampaign = {
  enabled: SORTEO_BREVE_ENABLED,
  // Hora Argentina (UTC-3). `endsAt` es exclusivo: el 1/11 ya no se muestra.
  startsAt: "2026-10-01T00:00:00-03:00",
  endsAt: "2026-11-01T00:00:00-03:00",
  card: {
    image: sorteoCardImg,
    imageAlt: "Sorteo SocioSA — Breve cumple 2 años",
    title: "Sorteo “Breve cumple 2 años” exclusivo socioSA",
    description: [
      "Breve está de aniversario y todas las semanas sorteamos 1 asado para 10 personas (incluye picada + snacks + bebida).",
      "Todas tus compras de octubre participan del sorteo. Sumando puntos, duplicás tus chances.",
      "Los ganadores se comunicarán en nuestro instagram.",
    ],
  },
  section: {
    image: sorteoSectionImg,
    imageAlt:
      "Ganá un asado completo para 10 personas — Breve cumple 2 años, mes de sorteos",
  },
  purchaseParticipation: {
    storeName: "Breve Market",
    storeAddress: "Av. Río de Janeiro 1621, Villa Allende",
    periodLabel: "durante octubre",
    frequencyLabel: "Sorteamos 1 asado para 10 personas por semana.",
  },
  instagram: {
    handle: "brevemarket",
    url: "https://www.instagram.com/brevemarket/",
  },
};

const CAMPAIGNS: SorteoCampaign[] = [BREVE_OCTUBRE_2026];

export function getActiveSorteoCampaign(
  now: Date = new Date(),
): SorteoCampaign | null {
  const time = now.getTime();
  return (
    CAMPAIGNS.find(
      (campaign) =>
        campaign.enabled &&
        time >= new Date(campaign.startsAt).getTime() &&
        time < new Date(campaign.endsAt).getTime(),
    ) ?? null
  );
}
