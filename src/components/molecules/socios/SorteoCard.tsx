"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CalendarDays } from "lucide-react";
import sorteoImg from "@/assets/seccion-sorteo-banner.jpg";
import { InstagramIcon } from "@/components/atoms/instagram-icon/instagram-icon";
import { getActiveSorteoCampaign } from "@/lib/sorteo-campaign";
import { type SociosView } from "@/types/socios";
import styles from "./SorteoCard.module.scss";

type SorteoActivo = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
};

interface SorteoCardProps {
  onNavigate: (view: SociosView) => void;
}

const formatShortDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "numeric" }).format(date);
};

export function SorteoCard({ onNavigate }: SorteoCardProps) {
  const campaign = getActiveSorteoCampaign();
  const [sorteo, setSorteo] = useState<SorteoActivo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (campaign) return;
    fetch("/api/legacy/sorteos/activo")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.sorteo) setSorteo(data.sorteo);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [campaign]);

  if (campaign) {
    const { card, instagram } = campaign;
    return (
      <article className={styles.card}>
        <div
          className={`${styles.imageWrap} ${styles.imageWrapCampaign}`}
          style={{ "--sorteo-img-ratio": card.image.width / card.image.height } as React.CSSProperties}
        >
          <Image
            src={card.image}
            alt={card.imageAlt}
            width={card.image.width}
            height={card.image.height}
            className={styles.image}
            sizes="(max-width: 639px) 100vw, 20rem"
          />
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{card.title}</h3>

          <div className={styles.description}>
            {card.description.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          {instagram ? (
            <a
              href={instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.instagramButton}
            >
              <InstagramIcon size={22} />
              {instagram.handle}
            </a>
          ) : null}
        </div>
      </article>
    );
  }

  const drawDate = sorteo ? formatShortDate(sorteo.fechaFin) : null;

  if (!isLoading && !sorteo) return null;

  return (
    <article className={styles.card}>
      <div
        className={styles.imageWrap}
        style={{ "--sorteo-img-ratio": sorteoImg.width / sorteoImg.height } as React.CSSProperties}
      >
        <Image
          src={sorteoImg}
          alt={sorteo?.nombre ?? "Sorteo SocioSA"}
          width={sorteoImg.width}
          height={sorteoImg.height}
          className={styles.image}
          sizes="(max-width: 639px) 100vw, 20rem"
        />
        {drawDate && (
          <span className={styles.dateBadge}>
            <CalendarDays size={12} />
            Se sortea el {drawDate}
          </span>
        )}
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.skeleton} />
        ) : (
          <h3 className={styles.title}>{sorteo!.nombre}</h3>
        )}

        <button
          type="button"
          className={styles.participateButton}
          onClick={() => onNavigate("sorteos")}
        >
          Participar
        </button>
      </div>
    </article>
  );
}
