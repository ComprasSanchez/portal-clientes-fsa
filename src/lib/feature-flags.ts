/** Subida de receta por el cliente (CORA y magic-link) — no se borró nada, solo se oculta. */
export const RECETA_UPLOAD_ENABLED =
  process.env.NEXT_PUBLIC_CORA_RECETA_UPLOAD_ENABLED === "true";

/** Pago con Mercado Pago al confirmar el pedido mensual (magic-link) — no se
 * borró nada, solo se oculta. Con la variable sin setear o en false, el
 * pedido se confirma directo (choice "contactenme"), igual que antes de que
 * existiera el pago online. */
export const MERCADOPAGO_PAGO_ENABLED =
  process.env.NEXT_PUBLIC_CORA_MERCADOPAGO_PAGO_ENABLED === "true";
