import { Gift, HelpCircle, Percent, Tag, Ticket } from "lucide-react";
import type { CalendarioTipoDia } from "@/types/portal-calendario";

const ICONOS = {
  TRIVIA: HelpCircle,
  DESCUENTO_MARCA: Tag,
  DESCUENTO_GENERAL: Percent,
  SORTEO: Ticket,
  PREMIO: Gift,
} as const;

/** Ícono de cada tipo de día del calendario. */
export default function TipoDiaIcono({ tipo, size = 16 }: { tipo: CalendarioTipoDia; size?: number }) {
  const Icono = ICONOS[tipo];
  return <Icono size={size} aria-hidden />;
}
