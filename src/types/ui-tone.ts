/**
 * Tema visual de los componentes genéricos. Ver `.tone-*` en `app/globals.css`.
 * - socios: turquesa del portal de socios.
 * - cora: violeta de CORA (gestión de expedientes).
 * - cora-portal: violeta suave del formulario público de pedido mensual de CORA.
 */
export type UiTone = "socios" | "cora" | "cora-portal";

export const toneClass = (tone: UiTone) => `tone-${tone}`;
