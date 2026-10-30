// Modo limitado: qué se va a poder ver en cada sección cuando la cuenta valide
// su identidad ("Confirmá que sos vos para ver …").

import type { SociosView } from "@/types/socios";
import type { HomeView } from "@/types/home";

export const MOTIVO_GENERAL = "tus puntos, compras y pedidos";

const MOTIVOS_SOCIOS: Partial<Record<SociosView, string>> = {
  "mi-cuenta": "tus datos",
  pedidos: "tus pedidos",
  facturas: "tus compras",
  puntos: "tus puntos",
  sorteos: "los sorteos y participar",
  sucursales: "las sucursales",
  notificaciones: "tus avisos",
  "colaboradores-ventas": "esta sección",
  "colaboradores-aplicaciones": "esta sección",
};

export const motivoSocios = (view: SociosView) => MOTIVOS_SOCIOS[view] ?? MOTIVO_GENERAL;

const MOTIVOS_CORA: Partial<Record<HomeView, string>> = {
  "mi-cuenta": "tus datos",
  pedidos: "tus pedidos de CORA",
  notificaciones: "tus avisos",
};

export const motivoCora = (view: HomeView) => MOTIVOS_CORA[view] ?? "tus tratamientos de CORA";
