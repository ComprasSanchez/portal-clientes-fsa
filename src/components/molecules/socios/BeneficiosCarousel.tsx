"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import dermoImg from "@/assets/sociosa-img/banner/categorias-01.jpg";
import makeUpImg from "@/assets/sociosa-img/banner/categorias-02.jpg";
import capilarImg from "@/assets/sociosa-img/banner/categorias-03.jpg";
import mundobebeImg from "@/assets/sociosa-img/banner/categorias-04.jpg";
import cuidadosPersonalImg from "@/assets/sociosa-img/banner/categorias-05.jpg";
import bienestarImg from "@/assets/sociosa-img/banner/categorias-06.jpg";
import styles from "./BeneficiosCarousel.module.scss";
import Link from "next/link";

const SLIDES = [
  {
    src: dermoImg,
    alt: "Dermocosmetica",
    href: "https://www.farmaciassanchezantoniolli.com.ar/50-dermocosmetica",
  },
  {
    src: makeUpImg,
    alt: "Maquillaje",
    href: "https://www.farmaciassanchezantoniolli.com.ar/30-maquillaje",
  },
  {
    src: capilarImg,
    alt: "Capilar",
    href: "https://www.farmaciassanchezantoniolli.com.ar/62-cuidado-capilar",
  },
  {
    src: mundobebeImg,
    alt: "Mundo bebé",
    href: "https://www.farmaciassanchezantoniolli.com.ar/23-mundo-beb%C3%A9",
  },
  {
    src: cuidadosPersonalImg,
    alt: "Cuidados personal",
    href: "https://www.farmaciassanchezantoniolli.com.ar/60-cuidado-personal",
  },
  {
    src: bienestarImg,
    alt: "Bienestar",
    href: "https://www.farmaciassanchezantoniolli.com.ar/80-nutricion-y-deportes",
  },
];

const AUTOPLAY_MS = 3500;

export function BeneficiosCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const t = setTimeout(updateArrows, 50);
    window.addEventListener("resize", updateArrows);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  const getSlideWidth = useCallback(() => {
    const el = trackRef.current;
    const firstSlide = el?.querySelector("[data-slide]") as HTMLElement | null;
    return firstSlide ? firstSlide.offsetWidth + 12 : 0;
  }, []);

  const scroll = useCallback(
    (dir: 1 | -1) => {
      const el = trackRef.current;
      if (!el) return;
      el.scrollBy({ left: dir * getSlideWidth(), behavior: "smooth" });
    },
    [getSlideWidth],
  );

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: getSlideWidth(), behavior: "smooth" });
      }
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [isPaused, getSlideWidth]);

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div ref={trackRef} className={styles.track} onScroll={updateArrows}>
        {SLIDES.map((slide, i) => (
          <div key={slide.alt} className={styles.slide} data-slide="">
            <Link href={slide.href} target="_blank">
              <Image
                src={slide.src}
                alt={slide.alt}
                width={slide.src.width}
                height={slide.src.height}
                draggable={false}
                sizes="(max-width: 480px) 85vw, (max-width: 768px) 50vw, 33vw"
                style={{ width: "100%", height: "auto", display: "block" }}
                priority={i === 0}
              />
            </Link>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={() => scroll(-1)}
        aria-label="Slide anterior"
        disabled={!canPrev}
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={() => scroll(1)}
        aria-label="Siguiente slide"
        disabled={!canNext}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
