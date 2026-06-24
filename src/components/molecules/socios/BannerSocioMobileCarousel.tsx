"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import bannerSocio1 from "@/assets/sociosa-img/banner-socio1.jpg";
import bannerSocio2 from "@/assets/sociosa-img/banner-socio2.jpg";
import styles from "./BannerCarousel.module.scss";

const SLIDES = [
  { src: bannerSocio1, alt: "Banner SocioSA — promo 1", href: null },
  { src: bannerSocio2, alt: "Banner SocioSA — participá en el sorteo", href: "/socios?view=sorteos" },
];

const AUTOPLAY_MS = 5000;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export function BannerSocioMobileCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

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
