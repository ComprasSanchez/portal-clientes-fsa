"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Alert from "@/components/atoms/alert/alert";
import TourParadaCard from "@/components/molecules/fin-de-anio/tour-parada-card/tour-parada-card";
import TourRecorrido from "@/components/molecules/fin-de-anio/tour-recorrido/tour-recorrido";
import TourSimulador from "@/components/molecules/fin-de-anio/tour-simulador/tour-simulador";
import { Skeleton } from "@/components/ui/skeleton";
import {
  avancePapaNoel,
  conSucursales,
  horarioParada,
  nombreParada,
  paradaDestacada,
  PILDORA_ESTADO,
  puntosDelMapa,
  textoEstado,
} from "@/lib/tour-papa-noel";
import { isModoPruebaCalendario } from "@/lib/fin-de-anio";
import { usePortalSucursales } from "@/lib/use-portal-sucursales";
import { usePortalTourPapaNoel } from "@/lib/use-portal-tour-papa-noel";
import styles from "./tour-papa-noel.module.scss";

const PASO_MS = 2400;

// Leaflet usa `window`: solo en el navegador.
const TourMapa = dynamic(() => import("@/components/molecules/fin-de-anio/tour-mapa/tour-mapa"), {
  ssr: false,
  loading: () => <Skeleton className={styles.mapaSkeleton} />,
});

/** Tour de Papá Noel: por dónde anda, la próxima parada y el recorrido completo. */
export default function TourPapaNoel() {
  const { tour, isLoading, error, refresh } = usePortalTourPapaNoel();
  const { sucursales, isLoading: cargandoSucursales } = usePortalSucursales();

  const paradas = useMemo(() => conSucursales(tour?.paradas ?? [], sucursales), [tour, sucursales]);
  const destacada = paradaDestacada(paradas);
  const puntos = useMemo(() => puntosDelMapa(paradas, destacada?.orden ?? null), [paradas, destacada?.orden]);
  const avanceReal = tour ? avancePapaNoel(tour, puntos) : null;

  // Solo pruebas: mover a Papá Noel a mano o verlo viajar parada por parada.
  const modoPrueba = isModoPruebaCalendario();
  const [simulado, setSimulado] = useState<number | null>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const ultima = Math.max(0, puntos.length - 1);
  useEffect(() => {
    if (!reproduciendo) return;
    const id = window.setInterval(() => {
      setSimulado((prev) => {
        const siguiente = Math.floor(prev ?? 0) + 1;
        if (siguiente >= ultima) setReproduciendo(false);
        return Math.min(siguiente, ultima);
      });
    }, PASO_MS);
    return () => window.clearInterval(id);
  }, [reproduciendo, ultima]);
  const reproducir = () => {
    setSimulado((prev) => (prev === null || prev >= ultima ? 0 : prev));
    setReproduciendo(true);
  };
  const avance = simulado ?? avanceReal;

  const cargando = isLoading || cargandoSucursales;

  return (
    <section className={styles.page}>
      <header className={styles.portada}>
        <p className={styles.volanta}>Fin de año · Tour de Papá Noel</p>
        <h2 className={styles.titulo}>¿Por dónde anda Papá Noel?</h2>
        <p className={styles.bajada}>
          Papá Noel recorre nuestras sucursales.
          <br />
          ¡Vení con los chicos y sacate la foto!
        </p>
      </header>

      <div className={styles.cuerpo}>
        {error && !tour && (
          <Alert color="warning">
            {error}{" "}
            <button type="button" className={styles.link} onClick={() => void refresh()}>
              Reintentar
            </button>
          </Alert>
        )}

        {cargando ? (
          <>
            <Skeleton className={styles.cardSkeleton} />
            <Skeleton className={styles.mapaSkeleton} />
          </>
        ) : (
          tour && (
            <>
              <TourParadaCard pildora={PILDORA_ESTADO[tour.estado]} lineas={[textoEstado(tour, destacada)]} />

              {puntos.length > 0 && <TourMapa puntos={puntos} avance={avance} />}

              {modoPrueba && puntos.length > 0 && (
                <TourSimulador
                  paradas={puntos.length}
                  avance={simulado}
                  reproduciendo={reproduciendo}
                  onCambiar={(v) => {
                    setReproduciendo(false);
                    setSimulado(v);
                  }}
                  onReproducir={reproducir}
                  onPausar={() => setReproduciendo(false)}
                  onVolverAlReal={() => {
                    setReproduciendo(false);
                    setSimulado(null);
                  }}
                />
              )}

              {destacada && (
                <TourParadaCard
                  pildora={destacada.estado === "AHORA" ? "Está acá ahora" : "Próxima parada"}
                  titulo={nombreParada(destacada)}
                  lineas={[horarioParada(destacada), destacada.datos?.direccion ?? ""].filter(Boolean)}
                />
              )}

              {paradas.length > 0 && (
                <div className={styles.recorrido}>
                  <h3 className={styles.subtitulo}>Recorrido completo</h3>
                  <TourRecorrido paradas={paradas} destacada={destacada?.orden ?? null} />
                </div>
              )}
            </>
          )
        )}
      </div>
    </section>
  );
}
