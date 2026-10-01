import {
  Banknote,
  CalendarClock,
  HeartPulse,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

export type AplicacionFsa = {
  id: string;
  nombre: string;
  descripcion: string;
  icon: LucideIcon;
  /** `null` si la URL no está configurada para este entorno. */
  url: string | null;
};

const toUrl = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
};

// Las variables NEXT_PUBLIC_* se tienen que leer con el nombre literal para
// que Next las incluya en el bundle del cliente.
export const APLICACIONES_FSA: AplicacionFsa[] = [
  {
    id: "horarios",
    nombre: "Horarios",
    descripcion: "Consultá tus turnos y horarios de trabajo.",
    icon: CalendarClock,
    url: toUrl(process.env.NEXT_PUBLIC_FSA_APP_HORARIOS_URL),
  },
  {
    id: "compras",
    nombre: "Compras",
    descripcion: "Pedidos y compras de la sucursal.",
    icon: ShoppingCart,
    url: toUrl(process.env.NEXT_PUBLIC_FSA_APP_COMPRAS_URL),
  },
  {
    id: "cronicos",
    nombre: "Cronicos / CORA",
    descripcion: "Gestión de pacientes crónicos, ciclos y pedidos de CORA.",
    icon: HeartPulse,
    url: toUrl(process.env.NEXT_PUBLIC_FSA_APP_CRONICOS_URL),
  },
  {
    id: "cajas",
    nombre: "Cajas",
    descripcion: "Control y cierre de cajas de la sucursal.",
    icon: Banknote,
    url: toUrl(process.env.NEXT_PUBLIC_FSA_APP_CAJAS_URL),
  },
];
