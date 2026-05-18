"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CircleAlert, CircleCheckBig, LoaderCircle, RefreshCw, Ticket } from "lucide-react";
import styles from "./SociosSorteosView.module.scss";

type SorteoActivo = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
};

type SorteoActivoResponse = {
  ok: boolean;
  error?: string;
  sorteo?: SorteoActivo;
};

type ParticiparSorteoResponse = {
  ok: boolean;
  alreadyParticipating?: boolean;
  verified?: boolean;
  requiresValidation?: boolean;
  message?: string;
  error?: string;
  estado?: string;
  participacionId?: number;
  sorteo?: {
    id: number;
    codigo: string;
    nombre: string;
  };
};

interface SociosSorteosViewProps {
  documentNumber: string | null;
  userName: string;
  phoneVerified: boolean;
}

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha definida";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

export function SociosSorteosView({ documentNumber, userName, phoneVerified }: SociosSorteosViewProps) {
  const [activeDraw, setActiveDraw] = useState<SorteoActivo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);
  const [participation, setParticipation] = useState<ParticiparSorteoResponse | null>(null);

  const loadActiveDraw = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/legacy/sorteos/activo", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json().catch(() => null)) as SorteoActivoResponse | null;

      if (!response.ok) {
        setActiveDraw(null);
        setLoadError(data?.error ?? "No pudimos consultar el sorteo activo.");
        return;
      }

      if (!data?.ok || !data.sorteo) {
        setActiveDraw(null);
        setLoadError(data?.error ?? "No hay un sorteo activo disponible ahora mismo.");
        return;
      }

      setActiveDraw(data.sorteo);
    } catch {
      setActiveDraw(null);
      setLoadError("No pudimos consultar el sorteo activo.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadActiveDraw();
  }, []);

  const handleParticipate = async () => {
    if (!documentNumber || !activeDraw) {
      return;
    }

    setIsParticipating(true);
    setParticipation(null);

    try {
      const response = await fetch("/api/legacy/sorteos/participar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documento: documentNumber,
          canal: "SOCIOSA_PORTAL",
        }),
      });

      const data = (await response.json().catch(() => null)) as ParticiparSorteoResponse | null;

      if (!response.ok || !data) {
        setParticipation({
          ok: false,
          error: data?.error ?? "No pudimos registrar tu participacion.",
        });
        return;
      }

      setParticipation(data);
    } catch {
      setParticipation({
        ok: false,
        error: "No pudimos registrar tu participacion.",
      });
    } finally {
      setIsParticipating(false);
    }
  };

  const participationMessage = participation?.message ?? participation?.error ?? null;
  const canParticipate = Boolean(documentNumber && activeDraw && !isParticipating && phoneVerified);

  return (
    <main className={styles.container}>
      <section className={styles.heroCard}>
        <div>
          <p className={styles.eyebrow}>Vista activa</p>
          <h1 className={styles.title}>Sorteos</h1>
          <p className={styles.description}>
            Consulta el sorteo vigente y participa con el documento asociado a tu cuenta de socio.
          </p>
        </div>
        <button className={styles.secondaryButton} onClick={() => void loadActiveDraw()} type="button">
          <RefreshCw size={16} />
          Actualizar
        </button>
      </section>

      <section className={styles.grid}>
        <article className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Sorteo actual</h2>
              {/* <p className={styles.panelSubtitle}>Estado actual del beneficio publicado para socios.</p> */}
            </div>
            <span className={styles.iconBadge}>
              <Ticket size={18} />
            </span>
          </div>

          {isLoading ? (
            <div className={styles.loadingBox}>
              <LoaderCircle className={styles.spinningIcon} size={18} />
              Cargando informacion del sorteo...
            </div>
          ) : loadError ? (
            <div className={styles.errorBox}>
              <CircleAlert size={18} />
              <span>{loadError}</span>
            </div>
          ) : activeDraw ? (
            <div className={styles.drawContent}>
              <div className={styles.drawHero}>
                <p className={styles.drawCode}>{activeDraw.codigo}</p>
                <h3 className={styles.drawName}>{activeDraw.nombre}</h3>
                <p className={styles.drawDescription}>
                  {activeDraw.descripcion?.trim()}
                </p>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>Inicio</span>
                  <strong className={styles.metaValue}>{formatDate(activeDraw.fechaInicio)}</strong>
                </div>
                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>Cierre</span>
                  <strong className={styles.metaValue}>{formatDate(activeDraw.fechaFin)}</strong>
                </div>
              </div>
            </div>
          ) : null}
        </article>

        <article className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Participar</h2>
              <p className={styles.panelSubtitle}>Registramos tu participacion usando tu cuenta actual.</p>
            </div>
            <span className={styles.iconBadgeAlt}>
              <CalendarDays size={18} />
            </span>
          </div>

          <div className={styles.identityCard}>
            <span className={styles.identityLabel}>Socio</span>
            <strong className={styles.identityValue}>{userName}</strong>
            <span className={styles.identityHint}>
              Documento usado para participar: {documentNumber?.trim() || "No disponible en tu perfil"}
            </span>
          </div>

          {!phoneVerified ? (
            <div className={styles.warningBox}>
              <CircleAlert size={18} />
              <span>
                Necesitás verificar tu celular para poder participar del sorteo. Andá a tu perfil y verificá tu número.
              </span>
            </div>
          ) : null}

          {!documentNumber ? (
            <div className={styles.warningBox}>
              <CircleAlert size={18} />
              <span>
                Tu cuenta no tiene documento disponible en el portal. Completa o valida tu perfil antes de participar.
              </span>
            </div>
          ) : null}

          {participationMessage ? (
            <div className={participation?.ok ? styles.successBox : styles.errorBox} role="status">
              {participation?.ok ? <CircleCheckBig size={18} /> : <CircleAlert size={18} />}
              <div>
                <p>{participationMessage}</p>
                {participation?.requiresValidation ? (
                  <small className={styles.inlineHint}>
                    La participacion quedo registrada pero requiere validacion adicional.
                  </small>
                ) : null}
                {participation?.alreadyParticipating ? (
                  <small className={styles.inlineHint}>Ya figurabas como participante en este sorteo.</small>
                ) : null}
              </div>
            </div>
          ) : null}

          <button className={styles.primaryButton} disabled={!canParticipate} onClick={() => void handleParticipate()} type="button">
            {isParticipating ? (
              <>
                <LoaderCircle className={styles.spinningIcon} size={16} />
                Registrando participacion...
              </>
            ) : (
              <>
                <Ticket size={16} />
                Participar del sorteo
              </>
            )}
          </button>
        </article>
      </section>
    </main>
  );
}
