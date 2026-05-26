"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import banner2x1 from "@/assets/sociosa-img/banner/banner-2x1.png";
import banner3x2 from "@/assets/sociosa-img/banner/banenr-3x2.png";
import bannerDescuentos from "@/assets/sociosa-img/banner/banner-descuentos.png";
import styles from "./BeneficiosCarousel.module.scss";
import Link from "next/link";

const SLIDES = [
  { src: banner2x1, alt: "2x1 en productos seleccionados" },
  { src: banner3x2, alt: "3x2 en productos seleccionados" },
  { src: bannerDescuentos, alt: "Descuentos exclusivos Socio SA" },
  { src: banner2x1, alt: "2x1 en producto" },
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
            <Link
              href={
                "https://www.farmaciassanchezantoniolli.com.ar/120-ofertasa"
              }
              target="_blank"
            >
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
