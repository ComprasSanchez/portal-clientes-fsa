// Fin de año (temporal): calendario de regalos de diciembre. Lógica pura, sin UI.
// Los datos (qué abrió, stock, trivia, retiros) vienen de eventos-back vía /api/portal/me/calendario.

import type { CalendarioCasilla, CalendarioEstadoCasilla } from "@/types/portal-calendario";

/** Se prende con NEXT_PUBLIC_FIN_DE_ANIO_ACTIVO=true; apagado, la sección no aparece. */
export const isFinDeAnioActivo = () => process.env.NEXT_PUBLIC_FIN_DE_ANIO_ACTIVO === "true";

/** Solo para probar (nunca en prod): muestra la sección antes del 1/12. */
export const isModoPruebaCalendario = () => process.env.NEXT_PUBLIC_FIN_DE_ANIO_MODO_PRUEBA === "true";

export const CALENDARIO_ANIO = 2026;
export const CALENDARIO_DESDE = `${CALENDARIO_ANIO}-12-01`;
const ZONA_HORARIA = "America/Argentina/Cordoba";

/** Fecha de hoy en Córdoba como "YYYY-MM-DD". */
export const hoyArgentina = (ahora = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(ahora);

/** Regla de Marketing: la sección aparece desde el 1/12 (antes, solo en modo prueba). */
export const isFinDeAnioVisible = () =>
  isFinDeAnioActivo() && (isModoPruebaCalendario() || hoyArgentina() >= CALENDARIO_DESDE);

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

export const BASES_CALENDARIO = [
  "Vigencia: del 1 al 31 de diciembre de 2026.",
  "Participan socios con su cuenta del portal validada.",
  "Se abre una casilla por día, solo en su fecha y una sola vez. Si no la abrís ese día, se pierde.",
  "Cada día puede traer una trivia (si respondés bien, sumás puntos), un descuento, un sorteo o un regalo hasta agotar los del día.",
  "En los sorteos, el resultado se ve al día siguiente.",
  "Los regalos se retiran en sucursal escaneando el QR de la sucursal desde el portal.",
  "Descuentos válidos solo en sucursal, mostrando la pantalla en caja.",
];

/** Una línea del texto de la casilla abierta: `fuente` "marca" es para nombres de marca. */
export type CalendarioRegaloLinea = { texto: string; tamano: "s" | "m" | "l"; fuente?: "serif" | "marca" };

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

export const fechaDelDia = (dia: number) => `${CALENDARIO_ANIO}-12-${String(dia).padStart(2, "0")}`;
export const diaConCero = (dia: number) => String(dia).padStart(2, "0");
export const fechaLegible = (dia: number) => `${dia} de diciembre`;

/** Grilla sin datos del socio: todo cerrado según la fecha de hoy. */
export function casillaSinDatos(dia: number, hoy: string): CalendarioCasilla {
  const fecha = fechaDelDia(dia);
  const estado: CalendarioEstadoCasilla = fecha > hoy ? "FUTURA" : fecha === hoy ? "DISPONIBLE" : "VENCIDA";
  return {
    fecha,
    tipo: null,
    estado,
    contenido: null,
    resultado: null,
    mensaje: null,
    trivia: null,
    sorteo: null,
  };
}

/** Estado de la casilla cerrada (la abierta se muestra con otro componente). */
export const estadoCerrado = (estado: CalendarioEstadoCasilla): "futuro" | "hoy" | "vencido" =>
  estado === "DISPONIBLE" ? "hoy" : estado === "VENCIDA" ? "vencido" : "futuro";

const FRASE_POR_DEFECTO = "Cada día trae su magia. Y mañana puede ser tu día…";

export type CalendarioTextos = {
  titulo: string;
  detalle: string | null;
  recuadro: { etiqueta: string; valor: string } | null;
  /** Lo que se ve en la casilla abierta de la grilla. */
  lineas: CalendarioRegaloLinea[];
};

/** Textos de un día ya abierto, según su tipo y lo que le tocó al socio. */
export function textosDeCasilla(casilla: CalendarioCasilla, dia: number): CalendarioTextos {
  const c = casilla.contenido;
  const r = casilla.resultado;
  const enCaja = { etiqueta: "Mostrá esta pantalla en caja", valor: `Válido el ${fechaLegible(dia)}` };

  if (c?.tipo === "DESCUENTO_MARCA") {
    return {
      titulo: `¡${c.porcentaje}% OFF en ${c.marca}!`,
      detalle: c.condiciones ?? "Exclusivo para socios, solo en sucursal.",
      recuadro: enCaja,
      lineas: [
        { texto: `${c.porcentaje}% off en`, tamano: "l" },
        { texto: c.marca, tamano: "m" },
      ],
    };
  }
  if (c?.tipo === "DESCUENTO_GENERAL") {
    return {
      titulo: c.titulo,
      detalle: c.detalle ?? c.condiciones ?? "Exclusivo para socios, solo en sucursal.",
      recuadro: enCaja,
      lineas: [{ texto: c.titulo, tamano: "m" }],
    };
  }
  // Qué se gana (premio o sorteo); sin cargar es sorpresa.
  const premio = (c?.tipo === "PREMIO" || c?.tipo === "SORTEO" ? c.queSeGana : null) || null;
  if (r?.tipo === "PREMIO") {
    return r.gano
      ? {
          titulo: premio ? `¡Ganaste ${premio}!` : "¡Ganaste un regalo sorpresa!",
          detalle: "Retiralo en cualquier sucursal escaneando el QR de la sucursal desde acá.",
          recuadro: { etiqueta: "Regalos de hoy", valor: `Quedan ${r.quedan} de ${r.total}` },
          lineas: [
            { texto: "¡Ganaste!", tamano: "l" },
            { texto: premio ?? "regalo sorpresa", tamano: "s" },
          ],
        }
      : {
          titulo: casilla.mensaje ?? FRASE_POR_DEFECTO,
          detalle: null,
          recuadro: null,
          lineas: [
            { texto: "Mañana", tamano: "m" },
            { texto: "puede ser tu día", tamano: "s" },
          ],
        };
  }
  if (r?.tipo === "SORTEO") {
    if (casilla.sorteo === "GANASTE") {
      return {
        titulo: "¡Ganaste el sorteo!",
        detalle: `Te llevás ${premio ?? "un regalo sorpresa"}. Retiralo en cualquier sucursal escaneando el QR desde acá.`,
        recuadro: null,
        lineas: [
          { texto: "¡Ganaste!", tamano: "l" },
          { texto: "el sorteo", tamano: "s" },
        ],
      };
    }
    if (casilla.sorteo === "NO_GANASTE") {
      return {
        titulo: "Esta vez no salió",
        detalle: FRASE_POR_DEFECTO,
        recuadro: null,
        lineas: [
          { texto: "Sorteo", tamano: "m" },
          { texto: "mañana hay más", tamano: "s" },
        ],
      };
    }
    return {
      titulo: "¡Ya estás participando!",
      detalle: premio
        ? `Se sortea ${premio}. El resultado sale mañana: volvé a ver si ganaste.`
        : "El resultado sale mañana. Volvé a ver si ganaste.",
      recuadro: { etiqueta: premio ? "Ganadores" : "Regalos sorpresa en juego", valor: String(r.cantidadRegalos) },
      lineas: [
        { texto: "Sorteo", tamano: "l" },
        { texto: `${r.cantidadRegalos} regalos`, tamano: "s" },
      ],
    };
  }
  if (c?.tipo === "TRIVIA") {
    const t = casilla.trivia;
    if (t?.respondida) {
      return t.correcta
        ? {
            titulo: "¡Respuesta correcta!",
            detalle: t.sinCuentaPuntos
              ? "Para sumar puntos, adherite al programa de puntos en tu sucursal."
              : `Sumaste ${t.puntos} puntos.`,
            recuadro: null,
            lineas: [
              { texto: "Trivia", tamano: "l" },
              { texto: "¡correcta!", tamano: "s" },
            ],
          }
        : {
            titulo: "Casi…",
            detalle: "Esta vez no fue, pero mañana hay otra sorpresa.",
            recuadro: null,
            lineas: [
              { texto: "Trivia", tamano: "l" },
              { texto: "respondida", tamano: "s" },
            ],
          };
    }
    return {
      titulo: "Trivia del día",
      detalle: `Respondé bien y sumá ${c.puntos} puntos.`,
      recuadro: null,
      lineas: [{ texto: "Trivia", tamano: "l" }],
    };
  }
  return { titulo: "¡Sorpresa!", detalle: null, recuadro: null, lineas: [{ texto: "¡Sorpresa!", tamano: "l" }] };
}

// Mensajes de error para el socio (sin jerga técnica).
const MENSAJES_ERROR: Record<string, string> = {
  CALENDARIO_DIA_YA_ABIERTO: "Ya abriste este día.",
  CALENDARIO_DIA_FUTURO: "Este día todavía no se puede abrir.",
  CALENDARIO_DIA_VENCIDO: "Este día ya pasó.",
  CALENDARIO_DIA_SIN_CONTENIDO: "La sorpresa de hoy todavía no está lista. Probá en un rato.",
  CALENDARIO_FUERA_DE_PERIODO: "Esa fecha no es parte del calendario.",
  CALENDARIO_DIA_NO_ABIERTO: "Primero abrí el día.",
  CALENDARIO_TRIVIA_YA_RESPONDIDA: "Ya respondiste la trivia de hoy.",
  CALENDARIO_TRIVIA_RESPUESTAS_INVALIDAS: "Respondé todas las preguntas.",
  CALENDARIO_QR_INVALIDO: "Ese QR no es para retirar regalos. Pedile al personal el suyo.",
  CALENDARIO_QR_VENCIDO: "El QR ya cambió. Pedile al personal que te lo muestre otra vez.",
  CALENDARIO_QR_NO_CONFIGURADO: "Todavía no se pueden entregar regalos. Probá en un rato.",
  CALENDARIO_SIN_REGALOS_PARA_RETIRAR: "No tenés regalos para retirar.",
  CALENDARIO_REINICIO_DESHABILITADO: "Reiniciar no está habilitado en este ambiente.",
  CALENDARIO_DIA_PASADO: "Ese día ya pasó y no se puede cambiar.",
  CALENDARIO_CONTENIDO_INVALIDO: "Revisá los datos del día: hay algo incompleto o fuera de rango.",
  CALENDARIO_DIA_CON_PARTICIPANTES: "Ese día ya lo abrieron socios y no se puede cambiar.",
  CALENDARIO_SORTEO_YA_EJECUTADO: "El sorteo de ese día ya se hizo.",
  CALENDARIO_SIN_PERMISO: "No tenés permiso para cargar el calendario.",
};

export const mensajeErrorCalendario = (code: string | null) =>
  (code && MENSAJES_ERROR[code]) || "No pudimos completar la acción. Probá de nuevo en un rato.";

const CODIGO_QR_RE = /^[A-Za-z0-9-]{4,64}$/;

/** Del texto del QR de la sucursal saca el código (acepta el link `/…/retiro/<codigo>` o el código solo). */
export function extraerCodigoRetiro(texto: string): string | null {
  const limpio = texto.trim();
  try {
    const match = new URL(limpio).pathname.match(/\/retiro\/([A-Za-z0-9-]{4,64})\/?$/);
    return match ? match[1] : null;
  } catch {
    return CODIGO_QR_RE.test(limpio) ? limpio : null;
  }
}

/** "Regalo del viernes 4/12: un kit Dermaglós" (o "regalo sorpresa"). */
export function textoRegalo(r: { fecha: string; origen: "PREMIO" | "SORTEO"; queSeGana?: string | null }): string {
  const dia = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", weekday: "long" }).format(
    new Date(`${r.fecha}T12:00:00Z`),
  );
  const [, mes, d] = r.fecha.split("-");
  const que = r.queSeGana || "regalo sorpresa";
  return `${r.origen === "SORTEO" ? "Sorteo" : "Regalo"} del ${dia} ${Number(d)}/${Number(mes)}: ${que}`;
}
