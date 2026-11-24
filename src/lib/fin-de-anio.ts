// Fin de año (temporal): calendario de regalos de diciembre. Lógica pura, sin UI.

/** Se prende con NEXT_PUBLIC_FIN_DE_ANIO_ACTIVO=true; apagado, la sección no aparece. */
export const isFinDeAnioActivo = () => process.env.NEXT_PUBLIC_FIN_DE_ANIO_ACTIVO === "true";

/** Solo para probar (NUNCA en prod): todas las casillas se pueden abrir sin esperar su día. */
export const isModoPruebaCalendario = () => process.env.NEXT_PUBLIC_FIN_DE_ANIO_MODO_PRUEBA === "true";

export const CALENDARIO_ANIO = 2026;
const ZONA_HORARIA = "America/Argentina/Cordoba";

export type CalendarioColor = "teal" | "rojo" | "amarillo" | "crema" | "navidad";
export type CalendarioIlustracion =
  | "campana"
  | "reno"
  | "regalo"
  | "mono"
  | "galleta"
  | "baston"
  | "corona"
  | "acebo"
  | "navidad"
  | "ninguna";

/** Cómo se acomoda cada casilla cerrada según su dibujo (como el diseño). */
export const ILUSTRACIONES: Record<
  CalendarioIlustracion,
  { imagen: string | null; numero: "arriba" | "abajo" | "centro" | "abajo-centro"; candado: "arriba" | "abajo-der" | "abajo-izq" }
> = {
  campana: { imagen: "/fin-de-anio/campana.webp", numero: "abajo", candado: "abajo-der" },
  reno: { imagen: "/fin-de-anio/reno.webp", numero: "arriba", candado: "arriba" },
  regalo: { imagen: "/fin-de-anio/regalo-verde.webp", numero: "arriba", candado: "arriba" },
  mono: { imagen: "/fin-de-anio/adorno.webp", numero: "abajo-centro", candado: "abajo-der" },
  galleta: { imagen: "/fin-de-anio/galleta.webp", numero: "arriba", candado: "arriba" },
  baston: { imagen: "/fin-de-anio/caramelo.webp", numero: "arriba", candado: "abajo-izq" },
  corona: { imagen: "/fin-de-anio/adorno.webp", numero: "arriba", candado: "abajo-izq" },
  acebo: { imagen: "/fin-de-anio/regalo.webp", numero: "arriba", candado: "arriba" },
  navidad: { imagen: null, numero: "arriba", candado: "arriba" },
  ninguna: { imagen: null, numero: "centro", candado: "abajo-der" },
};

/** Todo lo que el calendario necesita descargado antes de mostrarse. */
export const CALENDARIO_IMAGENES: readonly string[] = [
  ...new Set(Object.values(ILUSTRACIONES).flatMap((i) => (i.imagen ? [i.imagen] : []))),
  "/fin-de-anio/candado-cerrado.png",
  "/fin-de-anio/candado-abierto.png",
];

/** Una línea del regalo: `fuente` "marca" es para nombres de marca (ej. VICHY). */
export type CalendarioRegaloLinea = { texto: string; tamano: "s" | "m" | "l"; fuente?: "serif" | "marca" };

// Contenido de ejemplo del prototipo (Marketing define el real). Todo esto viaja al navegador:
// cupones y códigos reales tienen que salir de un back.
const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const PORCENTAJES = [10, 15, 20, 15];
const REGALOS_EJEMPLO = [
  "1 shampoo de 50 ml",
  "1 protector labial",
  "1 crema de manos de 30 ml",
  "1 alcohol en gel de 60 ml",
  "1 jabón líquido de 250 ml",
  "1 protector solar de 50 ml",
  "1 desodorante en aerosol",
];

export type CalendarioContenido = {
  tipo: "descuento" | "regalo";
  titulo: string;
  detalle: string;
  /** Texto del recuadro (en el prototipo, el código para la caja). */
  recuadro: { etiqueta: string; valor: string };
  /** Cómo se ve en la casilla abierta. */
  lineas: CalendarioRegaloLinea[];
};

/** Martes y jueves: descuento. El resto de los días: regalo. */
export function contenidoDelDia(dia: number): CalendarioContenido {
  const diaSemana = new Date(CALENDARIO_ANIO, 11, dia).getDay();
  if (diaSemana === 2 || diaSemana === 4) {
    const pct = PORCENTAJES[dia % PORCENTAJES.length];
    return {
      tipo: "descuento",
      titulo: `¡${pct}% OFF en [Marca]!`,
      detalle: `Exclusivo para socios. Válido el ${DIAS_SEMANA[diaSemana]} ${dia}/12, solo en sucursal. No acumulable con otras promociones.`,
      recuadro: { etiqueta: "Mostrá este código en caja", valor: "[CÓDIGO]" },
      lineas: [
        { texto: `${pct}% off en`, tamano: "l" },
        { texto: "[Marca]", tamano: "m" },
      ],
    };
  }
  const regalo = REGALOS_EJEMPLO[dia % REGALOS_EJEMPLO.length];
  return {
    tipo: "regalo",
    titulo: `¡Ganaste ${regalo}!`,
    detalle: "Regalo de [Marca]. Retiralo en tu sucursal presentando el código.",
    recuadro: { etiqueta: "Retiralo con este código", valor: "[CÓDIGO]" },
    lineas: [
      { texto: "Ganaste", tamano: "s" },
      { texto: regalo, tamano: "m" },
    ],
  };
}

export const regaloDelDia = (dia: number) => contenidoDelDia(dia).lineas;

export const BASES_CALENDARIO = [
  "Vigencia: del 1 al 31 de diciembre de 2026.",
  "Participan socios SocioSA con cuenta en el portal.",
  "Se abre una casilla por día, solo en su fecha. Si no la abrís ese día, se pierde.",
  "Martes y jueves: descuento. El resto de los días: regalo, hasta agotar el stock del día.",
  "Descuentos y regalos válidos solo en sucursal, presentando el código.",
];

/** Lugar en la grilla (1-based). */
export type CalendarioPosicion = { fila: number; columna: number; alto: number; ancho: number };

export type CalendarioDia = {
  dia: number;
  color: CalendarioColor;
  ilustracion: CalendarioIlustracion;
  /** Celular: grilla de 3 columnas (el diseño original). */
  movil: CalendarioPosicion;
  /** Tablet y compu: grilla de 6 columnas. */
  escritorio: CalendarioPosicion;
};

const pos = (fila: number, columna: number, alto = 1, ancho = 1): CalendarioPosicion => ({ fila, columna, alto, ancho });

// Bloque de 9 días que se repite (02-10, 11-19, 20-28). En celular ocupa 4 filas de 3
// columnas; en la compu, 2 filas de 6 (los dos altos se alternan para no repetir color).
const BLOQUE: Array<{
  color: CalendarioColor;
  ilustracion: CalendarioIlustracion;
  movil: (f: number) => CalendarioPosicion;
  escritorio: (f: number, impar: boolean) => CalendarioPosicion;
}> = [
  { color: "amarillo", ilustracion: "campana", movil: (f) => pos(f, 1), escritorio: (f) => pos(f, 1) },
  { color: "teal", ilustracion: "ninguna", movil: (f) => pos(f, 2), escritorio: (f) => pos(f, 2) },
  { color: "crema", ilustracion: "reno", movil: (f) => pos(f, 3, 2), escritorio: (f, i) => pos(f, i ? 4 : 3, 2) },
  { color: "teal", ilustracion: "regalo", movil: (f) => pos(f + 1, 1, 2), escritorio: (f, i) => pos(f, i ? 3 : 4, 2) },
  { color: "rojo", ilustracion: "mono", movil: (f) => pos(f + 1, 2), escritorio: (f) => pos(f, 5) },
  { color: "crema", ilustracion: "galleta", movil: (f) => pos(f + 2, 2), escritorio: (f) => pos(f, 6) },
  { color: "teal", ilustracion: "baston", movil: (f) => pos(f + 2, 3), escritorio: (f) => pos(f + 1, 1) },
  { color: "teal", ilustracion: "corona", movil: (f) => pos(f + 3, 1, 1, 2), escritorio: (f) => pos(f + 1, 5, 1, 2) },
  { color: "rojo", ilustracion: "acebo", movil: (f) => pos(f + 3, 3), escritorio: (f) => pos(f + 1, 2) },
];

const armarDias = (): CalendarioDia[] => {
  const dias: CalendarioDia[] = [
    { dia: 1, color: "rojo", ilustracion: "acebo", movil: pos(1, 3), escritorio: pos(1, 5, 1, 2) },
  ];
  for (let b = 0; b < 3; b++) {
    BLOQUE.forEach((item, i) => {
      dias.push({
        dia: 2 + b * 9 + i,
        color: item.color,
        ilustracion: item.ilustracion,
        movil: item.movil(2 + b * 4),
        escritorio: item.escritorio(2 + b * 2, b % 2 === 1),
      });
    });
  }
  const navidad = dias.find((d) => d.dia === 25);
  if (navidad) Object.assign(navidad, { color: "navidad", ilustracion: "navidad" });
  dias.push(
    { dia: 29, color: "amarillo", ilustracion: "campana", movil: pos(14, 1), escritorio: pos(8, 1) },
    { dia: 30, color: "teal", ilustracion: "ninguna", movil: pos(14, 2), escritorio: pos(8, 2) },
    { dia: 31, color: "crema", ilustracion: "reno", movil: pos(14, 3, 2), escritorio: pos(8, 3) },
  );
  return dias;
};

export const CALENDARIO_DIAS: CalendarioDia[] = armarDias();

/** Variables CSS con la ubicación de una casilla en las dos grillas. */
export const posicionComoVariables = ({ movil: m, escritorio: e }: Pick<CalendarioDia, "movil" | "escritorio">) => ({
  "--m-fila": m.fila,
  "--m-col": m.columna,
  "--m-alto": m.alto,
  "--m-ancho": m.ancho,
  "--e-fila": e.fila,
  "--e-col": e.columna,
  "--e-alto": e.alto,
  "--e-ancho": e.ancho,
});

/** Fecha de hoy en Córdoba como "YYYY-MM-DD". */
export const hoyArgentina = (ahora = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(ahora);

const fechaDelDia = (dia: number) => `${CALENDARIO_ANIO}-12-${String(dia).padStart(2, "0")}`;

export const estaDesbloqueado = (dia: number, hoy: string) => hoy >= fechaDelDia(dia);

/** futuro: todavía no llega · hoy: se puede abrir · abierto: ya la abrió · vencido: no la abrió en su día. */
export type CalendarioEstado = "futuro" | "hoy" | "abierto" | "vencido";

export function estadoDelDia(dia: number, hoy: string, abierto: boolean): CalendarioEstado {
  if (abierto) return "abierto";
  if (isModoPruebaCalendario()) return "hoy";
  const fecha = fechaDelDia(dia);
  if (fecha > hoy) return "futuro";
  return fecha === hoy ? "hoy" : "vencido";
}
export const esHoy = (dia: number, hoy: string) => hoy === fechaDelDia(dia);

export const diaConCero = (dia: number) => String(dia).padStart(2, "0");
export const fechaLegible = (dia: number) => `${dia} de diciembre`;

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Solo fuera de prod: `?fecha=2026-12-10` simula el día para probar el desbloqueo. */
export const fechaSimulada = (valor: string | null): string | null =>
  process.env.NODE_ENV !== "production" && valor && FECHA_RE.test(valor) ? valor : null;
