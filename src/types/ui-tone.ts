/**
 * Tema visual de los componentes genéricos. Ver `.tone-*` en `app/globals.css`.
 * - socios: turquesa del portal de socios.
 * - cora: violeta de CORA (gestión de expedientes).
 * - cora-portal: violeta suave del formulario público de pedido mensual de CORA.
 * - breve: amarillo y negro de Breve (juego de stands del evento).
 * - beauty: bordó y crema del catálogo AutoBeauty.
 */
export type UiTone = "socios" | "cora" | "cora-portal" | "breve" | "beauty";

export const toneClass = (tone: UiTone) => `tone-${tone}`;
