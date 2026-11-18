"use client";

import { useState } from "react";
import Badge from "@/components/atoms/badge/badge";
import BeautyHero from "@/components/molecules/beauty/beauty-hero/beauty-hero";
import BeautyPromosBancarias from "@/components/molecules/beauty/beauty-promos-bancarias/beauty-promos-bancarias";
import cuotasNaranjaX from "@/assets/sociosa-img/mobile-1.jpeg";
import cuotasCordobesa from "@/assets/sociosa-img/mobile-2.jpeg";
import planZNaranjaX from "@/assets/sociosa-img/mobile-3.jpeg";
import ProductCard from "@/components/molecules/product-card/product-card";
import SectionHeading from "@/components/molecules/section-heading/section-heading";
import SegmentedControl from "@/components/molecules/segmented-control/segmented-control";
import { BEAUTY_SECCIONES, productosDeSeccion } from "@/lib/beauty-catalogo";
import { toneClass } from "@/types/ui-tone";
import styles from "./beauty-catalogo.module.scss";

const PROMOS_BANCARIAS = [
  { imagen: cuotasCordobesa, alt: "Cordobesa: 6 cuotas sin interés en todas tus compras, solo en sucursales físicas" },
  { imagen: cuotasNaranjaX, alt: "Naranja X: 6 cuotas sin interés en compras superiores a $50.000, solo en sucursales físicas" },
  { imagen: planZNaranjaX, alt: "Naranja X Plan Z: sin interés en todas tus compras, solo en sucursales físicas" },
];

const FILTROS = [
  { value: "todo", label: "Todo" },
  ...BEAUTY_SECCIONES.map((s) => ({ value: s.id, label: s.categoria })),
];

export default function BeautyCatalogo() {
  const [filtro, setFiltro] = useState("todo");
  const secciones = BEAUTY_SECCIONES.filter((s) => filtro === "todo" || s.id === filtro);

  return (
    <div className={`${styles.page} ${toneClass("beauty")}`}>
      <BeautyHero
        marcas={["Serendipity", "Accurato"]}
        bajada="Maquillaje + dermo para vos"
      />

      <nav className={styles.filtros} aria-label="Categorías">
        <SegmentedControl
          options={FILTROS}
          value={filtro}
          onChange={setFiltro}
          variant="pills"
          tone="beauty"
          ariaLabel="Categorías del catálogo"
          className={styles.filtrosInner}
        />
      </nav>

      <div className={styles.content}>
        {secciones.map((seccion, i) => {
          const productos = productosDeSeccion(seccion);
          return (
            <section
              key={seccion.id}
              className={styles.section}
              aria-labelledby={`beauty-${seccion.id}`}
            >
              <SectionHeading
                id={`beauty-${seccion.id}`}
                title={seccion.categoria}
                subtitle={seccion.marcaLabel}
                tone="beauty"
                aside={
                  <Badge color="sale" size="md" tone="beauty" uppercase>
                    {seccion.descuentoPct}% off
                  </Badge>
                }
              />
              <ul className={styles.grid}>
                {productos.map((p, j) => (
                  <li key={p.ean}>
                    <ProductCard
                      imagen={p.imagen}
                      nombre={p.nombre}
                      presentacion={p.presentacion}
                      precio={p.precioBeauty}
                      precioAnterior={p.precioRegular}
                      descuentoPct={p.descuentoPct}
                      tone="beauty"
                      imagenPrioritaria={i === 0 && j < 4}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <BeautyPromosBancarias promos={PROMOS_BANCARIAS} />
    </div>
  );
}
