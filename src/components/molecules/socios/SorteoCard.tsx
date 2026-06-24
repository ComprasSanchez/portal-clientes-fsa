"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CalendarDays, Ticket } from "lucide-react";
// import sorteoImg from "@/assets/imagen-sola.png";
import sorteoImg from "@/assets/banners-09.jpg";
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
  documentNumber: string | null;
}

const formatShortDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "numeric" }).format(date);
};

export function SorteoCard({ onNavigate, documentNumber }: SorteoCardProps) {
  const [sorteo, setSorteo] = useState<SorteoActivo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/legacy/sorteos/activo")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.sorteo) setSorteo(data.sorteo);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const drawDate = sorteo ? formatShortDate(sorteo.fechaFin) : null;

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={sorteoImg}
          alt={sorteo?.nombre ?? "Sorteo SocioSA"}
          width={sorteoImg.width}
          height={sorteoImg.height}
          className={styles.image}
          sizes="(max-width: 639px) 100vw, 14rem"
        />
        {drawDate && (
          <span className={styles.dateBadge}>
            <CalendarDays size={12} />
            Se sortea el {drawDate}
          </span>
        )}
      </div>

      <div className={styles.content}>
        <span className={styles.chip}>
          <Ticket size={13} />
          Sorteo
        </span>

        {isLoading ? (
          <div className={styles.skeleton} />
        ) : sorteo ? (
          <>
            <h3 className={styles.title}>{sorteo.nombre}</h3>
            {documentNumber && (
              <p className={styles.meta}>Documento: {documentNumber}</p>
            )}
          </>
        ) : (
          <h3 className={styles.title}>Próximamente nuevo sorteo</h3>
        )}

        <button
          type="button"
          className={styles.button}
          onClick={() => onNavigate("sorteos")}
        >
          {sorteo ? "Participar" : "Ver sorteos"}
        </button>
      </div>
    </article>
  );
}
