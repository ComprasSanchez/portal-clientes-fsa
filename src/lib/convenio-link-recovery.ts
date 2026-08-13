/**
 * Recupera el nombre de convenio embebido dentro de un valor de `canal` mal
 * armado — links/QR ya distribuidos (ej. `?canal=CONVENIOS=CONCI CARPINELLA`)
 * en vez del formato correcto `?convenio=CONCI CARPINELLA` por separado.
 * Como esos links ya están impresos y no se pueden reemplazar, se recupera
 * el valor real acá. Devuelve `null` si `rawCanal` no matchea ese patrón.
 *
 * Compartido entre `login.tsx` (captura para registro nuevo) y `page.tsx`
 * (redirect de usuario ya logueado) para no duplicar la regex en los dos
 * lugares y que no se desincronicen.
 */
export function recoverConvenioFromCanal(
  rawCanal?: string | null,
): string | null {
  if (!rawCanal) return null;
  const match = rawCanal.trim().match(/^CONVENIOS?=(.+)$/i);
  return match?.[1]?.trim() || null;
}
