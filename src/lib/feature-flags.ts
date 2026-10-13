/** Subida de receta por el cliente (CORA y magic-link) — no se borró nada, solo se oculta. */
export const RECETA_UPLOAD_ENABLED =
  process.env.NEXT_PUBLIC_CORA_RECETA_UPLOAD_ENABLED === "true";

/** Pago con Mercado Pago al confirmar el pedido mensual (magic-link) — no se
 * borró nada, solo se oculta. Con la variable sin setear o en false, el
 * pedido se confirma directo (choice "contactenme"), igual que antes de que
 * existiera el pago online. */
export const MERCADOPAGO_PAGO_ENABLED =
  process.env.NEXT_PUBLIC_CORA_MERCADOPAGO_PAGO_ENABLED === "true";

/** Campaña "Breve cumple 2 años" (sorteo por compra, octubre 2026). Además de
 * la variable, la campaña se apaga sola al pasar su fecha de fin (ver
 * `sorteo-campaign.ts`). Con la variable sin setear o en false, Sorteos y la
 * tarjeta de /socios funcionan como siempre (datos del CRM + botón). */
export const SORTEO_BREVE_ENABLED =
  process.env.NEXT_PUBLIC_SORTEO_BREVE_ACTIVO === "true";
