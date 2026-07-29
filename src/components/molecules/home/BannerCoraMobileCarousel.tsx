"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import bannerCora1 from "@/assets/cora/banners/banner-cora-1.png";
import bannerCora2 from "@/assets/cora/banners/banner-cora-2.png";
import bannerCora3 from "@/assets/cora/banners/banner-cora-3.png";
import bannerCora4 from "@/assets/cora/banners/banner-cora-4.jpg";
import styles from "./BannerCoraCarousel.module.scss";

const SLIDES = [
  {
    src: bannerCora1,
    alt: "Estoy para acompañarte, sigo tus entregas y organizo tus recordatorios",
    href: null,
  },
  {
    src: bannerCora2,
    alt: "Si tomás medicacion todos los meses, CORA es para vos",
    href: null,
  },
  {
    src: bannerCora3,
    alt: "CORA es para vos",
    href: null,
  },
  {
    src: bannerCora4,
    alt: "¿Cómo funciona?",
    href: null,
  },
];

const AUTOPLAY_MS = 5000;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export function BannerCoraMobileCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  useEffect(() => {
    if (isPaused || SLIDES.length <= 1) return;
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
        <div className={styles.sizer} aria-hidden="true">
          <Image
            src={SLIDES[0].src}
            alt=""
            width={SLIDES[0].src.width}
            height={SLIDES[0].src.height}
            sizes="100vw"
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
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={styles.slide}
          >
            {SLIDES[current].href ? (
              <Link href={SLIDES[current].href} className={styles.slideLink}>
                <Image
                  src={SLIDES[current].src}
                  alt={SLIDES[current].alt}
                  fill
                  draggable={false}
                  sizes="100vw"
                  className={styles.image}
                  priority={current === 0}
                />
              </Link>
            ) : (
              <Image  
                src={SLIDES[current].src}
                alt={SLIDES[current].alt}
                fill
                draggable={false}
                sizes="100vw"
                className={styles.image}
                priority={current === 0}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {SLIDES.length > 1 ? (
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
      ) : null}
    </div>
  );
}
