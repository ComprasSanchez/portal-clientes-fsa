"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import finDeSemanaBanner from "@/assets/sociosa-img/fin-de-semana-banner.jpg";
import panalesBanner from "@/assets/sociosa-img/pañales-baner.jpg";
import styles from "./BannerCarousel.module.scss";

const SLIDES = [
  {
    src: finDeSemanaBanner,
    alt: "Sorteo Socio SA — Ganá un fin de semana en Las Sierras para dos personas",
  },
  {
    src: panalesBanner,
    alt: "Promo pañales Socio SA",
  },
];

const AUTOPLAY_MS = 5000;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const prev = useCallback(() => {
    goTo((current - 1 + SLIDES.length) % SLIDES.length, -1);
  }, [current, goTo]);

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length, 1);
  }, [current, goTo]);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [isPaused]);

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.track}>
        {/* Invisible sizer: lets the track height follow the image's natural aspect ratio */}
        <div className={styles.sizer} aria-hidden="true">
          <Image
            src={SLIDES[0].src}
            alt=""
            width={SLIDES[0].src.width}
            height={SLIDES[0].src.height}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) calc(100vw - 16rem), 80rem"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className={styles.slide}
          >
            <Image
              src={SLIDES[current].src}
              alt={SLIDES[current].alt}
              fill
              draggable={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) calc(100vw - 16rem), 80rem"
              className={styles.image}
              priority={current === 0}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={prev}
        aria-label="Slide anterior"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={next}
        aria-label="Siguiente slide"
      >
        <ChevronRight size={20} />
      </button>

      <div className={styles.dots} role="tablist">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.alt}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1}`}
            className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
            onClick={() => goTo(i, i >= current ? 1 : -1)}
          />
        ))}
      </div>
    </div>
  );
}
