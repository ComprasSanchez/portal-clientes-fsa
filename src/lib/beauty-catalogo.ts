// Catálogo AutoBeauty (Serendipity + Accurato). Datos fijos sacados de
// public/SERENDIPITY - ACCURATO.xlsx; precios redondeados a pesos enteros.

/** Se muestra en el menú solo con NEXT_PUBLIC_BEAUTY_ACTIVO=true. */
export const isBeautyActivo = () => process.env.NEXT_PUBLIC_BEAUTY_ACTIVO === "true";

export type BeautyMarca = "accurato" | "serendipity";

export type BeautyProducto = {
  ean: string;
  marca: BeautyMarca;
  nombre: string;
  presentacion: string | null;
  precioRegular: number;
  precioBeauty: number;
  descuentoPct: number;
  imagen: string;
};

export type BeautySeccion = {
  id: string;
  marca: BeautyMarca;
  categoria: string;
  marcaLabel: string;
  descuentoPct: number;
};

/** Fecha y sucursal de la promo (columnas FECHA y SUCU del Excel). */
export const BEAUTY_EVENTO = {
  fecha: "Viernes 20/11",
  sucursal: "Solo en Sucursal 25",
};

export const BEAUTY_SECCIONES: BeautySeccion[] = [
  { id: "dermo", marca: "accurato", categoria: "Dermo", marcaLabel: "Accurato", descuentoPct: 30 },
  { id: "maquillaje", marca: "serendipity", categoria: "Maquillaje", marcaLabel: "Serendipity", descuentoPct: 25 },
];

export const BEAUTY_PRODUCTOS: BeautyProducto[] = [
  { ean: "7798336870291", marca: "accurato", nombre: "CONTORNO DE OJOS", presentacion: "x 20 ml", precioRegular: 38549, precioBeauty: 26984, descuentoPct: 30, imagen: "/beauty/productos/accurato-contorno-de-ojos-pomo-x-20-ml.webp" },
  { ean: "7798336870277", marca: "accurato", nombre: "CREMA DE NOCHE", presentacion: "x 50 ml", precioRegular: 45719, precioBeauty: 32003, descuentoPct: 30, imagen: "/beauty/productos/accurato-crema-de-noche-pote-x-50-ml.webp" },
  { ean: "7798336870246", marca: "accurato", nombre: "CREMA EXFOLIANTE", presentacion: "x 50 ml", precioRegular: 23469, precioBeauty: 16428, descuentoPct: 30, imagen: "/beauty/productos/accurato-crema-exfoliante-pomo-x-50-ml.webp" },
  { ean: "7798336870253", marca: "accurato", nombre: "CREMA LIVIANA", presentacion: "x 50 ml", precioRegular: 45719, precioBeauty: 32003, descuentoPct: 30, imagen: "/beauty/productos/accurato-crema-liviana-pote-x-50-ml.webp" },
  { ean: "7798336870260", marca: "accurato", nombre: "CREMA RICA", presentacion: "x 50 ml", precioRegular: 45719, precioBeauty: 32003, descuentoPct: 30, imagen: "/beauty/productos/accurato-crema-rica-pote-x-50-ml.webp" },
  { ean: "7798336870192", marca: "accurato", nombre: "EMULSIÓN CORPORAL ANTIOXIDANTE", presentacion: "x 250 ml", precioRegular: 23189, precioBeauty: 16232, descuentoPct: 30, imagen: "/beauty/productos/accurato-emulsion-corporal-antioxidante-x-250-ml.webp" },
  { ean: "7798336870208", marca: "accurato", nombre: "EMULSIÓN CORPORAL HIDRATANTE", presentacion: "x 250 ml", precioRegular: 29219, precioBeauty: 20453, descuentoPct: 30, imagen: "/beauty/productos/accurato-emulsion-corporal-hidratante-x-250-ml.webp" },
  { ean: "7798336870222", marca: "accurato", nombre: "EMULSIÓN LIMPIADORA", presentacion: "x 150 ml", precioRegular: 24419, precioBeauty: 17093, descuentoPct: 30, imagen: "/beauty/productos/accurato-emulsion-limpiadora-pomo-x-150-ml.webp" },
  { ean: "7798336870215", marca: "accurato", nombre: "EMULSIÓN PARA MANOS Y PIES ALTAMENTE HIDRATANTE", presentacion: "x 100 ml", precioRegular: 18379, precioBeauty: 12865, descuentoPct: 30, imagen: "/beauty/productos/accurato-emulsion-para-manos-y-pies-altamente-hidratante-x-100-ml.webp" },
  { ean: "7798336870239", marca: "accurato", nombre: "GEL DE LIMPIEZA", presentacion: "x 150 ml", precioRegular: 24419, precioBeauty: 17093, descuentoPct: 30, imagen: "/beauty/productos/tubo-accurato-eno-clean-detallado.webp" },
  { ean: "7798336870284", marca: "accurato", nombre: "SERUM ANTIAGE", presentacion: "x 30 ml", precioRegular: 45719, precioBeauty: 32003, descuentoPct: 30, imagen: "/beauty/productos/accurato-serum-antiage-x-30-ml.webp" },
  { ean: "7798336870413", marca: "accurato", nombre: "SET ENO REGEN SERUM + CREMA RICA", presentacion: null, precioRegular: 73999, precioBeauty: 51799, descuentoPct: 30, imagen: "/beauty/productos/set-accurato-eno-regen.webp" },
  { ean: "7798340700911", marca: "serendipity", nombre: "BASE DE MAQUILLAJE DE LUCA TONO 1", presentacion: null, precioRegular: 29009, precioBeauty: 21757, descuentoPct: 25, imagen: "/beauty/productos/base-de-maquillaje-serendipity-de-luca-tono-1.webp" },
  { ean: "7798340700928", marca: "serendipity", nombre: "BASE DE MAQUILLAJE DE LUCA TONO 2", presentacion: null, precioRegular: 29009, precioBeauty: 21757, descuentoPct: 25, imagen: "/beauty/productos/base-de-maquillaje-serendipity-de-luca-tono-1.webp" },
  { ean: "7798340701604", marca: "serendipity", nombre: "BRUMA GLOW UP! SHIMMER SPRAY ROSA", presentacion: null, precioRegular: 22009, precioBeauty: 16507, descuentoPct: 25, imagen: "/beauty/productos/sprays-de-brillo-up-glow.webp" },
  { ean: "7798340702144", marca: "serendipity", nombre: "BRUMA GLOW UP! SHIMMER SPRAY DORADO", presentacion: null, precioRegular: 22009, precioBeauty: 16507, descuentoPct: 25, imagen: "/beauty/productos/sprays-de-brillo-up-glow.webp" },
  { ean: "7798340709365", marca: "serendipity", nombre: "CONTORNO EN BARRA BRONZY", presentacion: null, precioRegular: 23579, precioBeauty: 17684, descuentoPct: 25, imagen: "/beauty/productos/contorno-en-barra-serendipity-bronzy.webp" },
  { ean: "7798340701581", marca: "serendipity", nombre: "CORRECTOR BAILEY LÍQUIDO HD PLUS", presentacion: null, precioRegular: 22999, precioBeauty: 17249, descuentoPct: 25, imagen: "/beauty/productos/corrector-serendipity-bailey-liquido-hd-plus.webp" },
  { ean: "7798340701598", marca: "serendipity", nombre: "CORRECTOR JACKSON LÍQUIDO HD PLUS", presentacion: null, precioRegular: 22999, precioBeauty: 17249, descuentoPct: 25, imagen: "/beauty/productos/corrector-serendipity-bailey-liquido-hd-plus.webp" },
  { ean: "7798340701536", marca: "serendipity", nombre: "CREMA CORPORAL CON COLOR", presentacion: null, precioRegular: 33999, precioBeauty: 25499, descuentoPct: 25, imagen: "/beauty/productos/crema-corporal-serendipity-con-color.webp" },
  { ean: "7798340709693", marca: "serendipity", nombre: "GLOSS LACQUER DEREK", presentacion: null, precioRegular: 22999, precioBeauty: 17249, descuentoPct: 25, imagen: "/beauty/productos/gloss-serendipity-lacquer-derek.webp" },
  { ean: "7798340709358", marca: "serendipity", nombre: "ILUMINADOR EN BARRA SHINY", presentacion: null, precioRegular: 23579, precioBeauty: 17684, descuentoPct: 25, imagen: "/beauty/productos/iluminador-en-barra-serendipity-shiny.webp" },
  { ean: "7798340707590", marca: "serendipity", nombre: "ILUMINADOR SUNNY GLOW", presentacion: null, precioRegular: 26999, precioBeauty: 20249, descuentoPct: 25, imagen: "/beauty/productos/iluminador-serendipity-sunny-glow.webp" },
  { ean: "7798340709372", marca: "serendipity", nombre: "KIT DE BARRAS ILUMINADOR + RUBOR + CONTORNO", presentacion: null, precioRegular: 63619, precioBeauty: 47714, descuentoPct: 25, imagen: "/beauty/productos/kit-de-barras-serendipity-iluminador-rubor-contorno.webp" },
  { ean: "7798483110141", marca: "serendipity", nombre: "LABIAL LÍQUIDO MATE INTRANSFERIBLE ROSE", presentacion: null, precioRegular: 22999, precioBeauty: 17249, descuentoPct: 25, imagen: "/beauty/productos/labial-liquido-serendipity-mate-intransferible-rose.webp" },
  { ean: "7798483110158", marca: "serendipity", nombre: "LABIAL LÍQUIDO MATE INTRANSFERIBLE NUDE", presentacion: null, precioRegular: 22999, precioBeauty: 17249, descuentoPct: 25, imagen: "/beauty/productos/labial-liquido-serendipity-mate-intransferible-nude.webp" },
  { ean: "7798483110127", marca: "serendipity", nombre: "LABIAL LÍQUIDO MATE INTRANSFERIBLE RED", presentacion: null, precioRegular: 22999, precioBeauty: 17249, descuentoPct: 25, imagen: "/beauty/productos/labial-liquido-serendipity-mate-intransferible-red.webp" },
  { ean: "7798483110134", marca: "serendipity", nombre: "LABIAL LÍQUIDO MATE INTRANSFERIBLE TOAST", presentacion: null, precioRegular: 22999, precioBeauty: 17249, descuentoPct: 25, imagen: "/beauty/productos/labial-liquido-serendipity-mate-intransferible-toast.webp" },
  { ean: "7798340701260", marca: "serendipity", nombre: "LABIAL DEREK CREMOSO", presentacion: null, precioRegular: 22009, precioBeauty: 16507, descuentoPct: 25, imagen: "/beauty/productos/labial-serendipity-derek-cremoso.webp" },
  { ean: "7798340701970", marca: "serendipity", nombre: "LABIAL BLOOM CREMOSO", presentacion: null, precioRegular: 22009, precioBeauty: 16507, descuentoPct: 25, imagen: "/beauty/productos/labial-serendipity-derek-cremoso.webp" },
  { ean: "7798340701963", marca: "serendipity", nombre: "LABIAL CARAMEL CREMOSO", presentacion: null, precioRegular: 22009, precioBeauty: 16507, descuentoPct: 25, imagen: "/beauty/productos/labial-serendipity-derek-cremoso.webp" },
  { ean: "7798340703974", marca: "serendipity", nombre: "LIP OIL MELON", presentacion: null, precioRegular: 25009, precioBeauty: 18757, descuentoPct: 25, imagen: "/beauty/productos/lip-oil-serendipity-melon.webp" },
  { ean: "7798340703981", marca: "serendipity", nombre: "LIP OIL PEACH", presentacion: null, precioRegular: 25009, precioBeauty: 18757, descuentoPct: 25, imagen: "/beauty/productos/lip-oil-serendipity-peach.webp" },
  { ean: "7798340707798", marca: "serendipity", nombre: "LIP OIL CANDY", presentacion: null, precioRegular: 18999, precioBeauty: 14249, descuentoPct: 25, imagen: "/beauty/productos/lip-oil-serendipity-candy.webp" },
  { ean: "7798340706944", marca: "serendipity", nombre: "LIP MASK", presentacion: null, precioRegular: 22009, precioBeauty: 16507, descuentoPct: 25, imagen: "/beauty/productos/lip-serendipity-mask.webp" },
  { ean: "7798483110042", marca: "serendipity", nombre: "PERLAS SHIMMER BRONZE", presentacion: null, precioRegular: 18999, precioBeauty: 14249, descuentoPct: 25, imagen: "/beauty/productos/perlas-shimmer-serendipity-bronze.webp" },
  { ean: "7798483110035", marca: "serendipity", nombre: "PERLAS SHIMMER SNOW", presentacion: null, precioRegular: 18999, precioBeauty: 14249, descuentoPct: 25, imagen: "/beauty/productos/perlas-shimmer-serendipity-bronze.webp" },
  { ean: "7798483110028", marca: "serendipity", nombre: "PERLAS SHIMMER MOCA", presentacion: null, precioRegular: 18999, precioBeauty: 14249, descuentoPct: 25, imagen: "/beauty/productos/perlas-shimmer-serendipity-bronze.webp" },
  { ean: "7798340709754", marca: "serendipity", nombre: "PRIMER REBECA", presentacion: null, precioRegular: 29009, precioBeauty: 21757, descuentoPct: 25, imagen: "/beauty/productos/primer-serendipity-rebeca.webp" },
  { ean: "7798340709341", marca: "serendipity", nombre: "RUBOR EN BARRA BLUSHY", presentacion: null, precioRegular: 23579, precioBeauty: 17684, descuentoPct: 25, imagen: "/beauty/productos/rubor-en-barra-serendipity-blushy.webp" },
  { ean: "7798340707781", marca: "serendipity", nombre: "RUBOR LÍQUIDO SWEET BLUSH", presentacion: null, precioRegular: 25009, precioBeauty: 18757, descuentoPct: 25, imagen: "/beauty/productos/rubor-liquido-serendipity-sweet-blush.webp" },
  { ean: "7798340709310", marca: "serendipity", nombre: "RUBOR LÍQUIDO SWEET BLUSH ROSE", presentacion: null, precioRegular: 23579, precioBeauty: 17684, descuentoPct: 25, imagen: "/beauty/productos/rubor-liquido-serendipity-sweet-blush-rose.webp" },
];

export const productosDeSeccion = (seccion: BeautySeccion) =>
  BEAUTY_PRODUCTOS.filter((p) => p.marca === seccion.marca);
