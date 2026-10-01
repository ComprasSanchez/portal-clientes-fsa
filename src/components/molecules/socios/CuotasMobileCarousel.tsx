"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import mobile1 from "@/assets/sociosa-img/mobile-1.jpg";
import mobile2 from "@/assets/sociosa-img/mobile-2.jpg";
import styles from "./BannerCarousel.module.scss";

const SLIDES = [
  { src: mobile1, alt: "Cordobesa — 4 cuotas sin interés en todas tus compras" },
  { src: mobile2, alt: "NaranjaX Plan Z — sin interés en todas tus compras" },
];

const AUTOPLAY_MS = 4000;
const SWIPE_OFFSET_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 300;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export function CuotasMobileCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsPaused(false);
      if (SLIDES.length <= 1) return;

      if (
        info.offset.x < -SWIPE_OFFSET_THRESHOLD ||
        info.velocity.x < -SWIPE_VELOCITY_THRESHOLD
      ) {
        setDirection(1);
        setCurrent((c) => (c + 1) % SLIDES.length);
      } else if (
        info.offset.x > SWIPE_OFFSET_THRESHOLD ||
        info.velocity.x > SWIPE_VELOCITY_THRESHOLD
      ) {
        setDirection(-1);
        setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
      }
    },
    [],
  );

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
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragStart={() => setIsPaused(true)}
            onDragEnd={handleDragEnd}
          >
            <Image
              src={SLIDES[current].src}
              alt={SLIDES[current].alt}
              fill
              draggable={false}
              sizes="100vw"
              className={styles.image}
              priority={current === 0}
            />
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
