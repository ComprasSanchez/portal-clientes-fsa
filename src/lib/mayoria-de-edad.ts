// Misma regla que el gateway (core/rules/mayoria-de-edad.ts): 18 años cumplidos,
// contando el día según el calendario de Argentina.

export const EDAD_MINIMA = 18;
const EDAD_MAXIMA = 120;

/** Hoy en Argentina como 'YYYY-MM-DD' (sirve también como `max` del input de fecha). */
export const hoyEnArgentina = (now: Date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(now);

/** Edad cumplida a `hoy`, o null si la fecha no es un 'YYYY-MM-DD' real. */
export function edadEnAnios(fecha: string, hoy: string = hoyEnArgentina()): number | null {
  const nac = parseFecha(fecha);
  const ref = parseFecha(hoy);
  if (!nac || !ref) return null;
  const [ny, nm, nd] = nac;
  const [ry, rm, rd] = ref;
  const cumplioEsteAnio = rm > nm || (rm === nm && rd >= nd);
  return ry - ny - (cumplioEsteAnio ? 0 : 1);
}

/** Mensaje de error para el campo, o undefined si la fecha es válida y de un mayor de edad. */
export function errorFechaNacimiento(fecha: string): string | undefined {
  if (!fecha) return "Ingresá tu fecha de nacimiento.";
  const edad = edadEnAnios(fecha);
  if (edad === null || edad < 0 || edad > EDAD_MAXIMA) return "Revisá la fecha de nacimiento.";
  if (edad < EDAD_MINIMA) return "Para crear una cuenta tenés que ser mayor de 18 años.";
  return undefined;
}

function parseFecha(fecha: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  const real =
    date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
  return real ? [y, mo, d] : null;
}
