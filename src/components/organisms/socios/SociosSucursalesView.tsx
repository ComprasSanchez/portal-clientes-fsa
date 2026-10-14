"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect, useRef } from "react";
import { CircleAlert, MapPin, Navigation, Phone, MessageCircle, ExternalLink } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import Badge from "@/components/atoms/badge/badge";
import EmptyState from "@/components/molecules/empty-state/empty-state";
import SearchInput from "@/components/molecules/search-input/search-input";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_BLOCK = "rounded-md bg-[#e8f0f3]";
import { usePortalSucursales } from "@/lib/use-portal-sucursales";
import { haversineDistance, formatDistance } from "@/utils/distance";
import type { Sucursal, SucursalWithDistance } from "@/types/sucursal";
import styles from "./SociosSucursalesView.module.scss";

const LeafletMap = dynamic(
  () => import("@/components/molecules/sucursales/LeafletMap").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className={styles.mapPlaceholder}>
        <div className={styles.mapPlaceholderInner}>
          <MapPin size={28} className={styles.mapPlaceholderIcon} />
          <p className={styles.mapPlaceholderText}>Cargando mapa…</p>
        </div>
      </div>
    ),
  },
);

function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function getWhatsAppUrl(whatsapp: string): string {
  return `https://wa.me/${whatsapp}`;
}

export function SociosSucursalesView() {
  const { sucursales, isLoading: isSucursalesLoading, error: sucursalesError } = usePortalSucursales();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [centerUserTrigger, setCenterUserTrigger] = useState(0);
  const itemRefsMap = useRef<Map<string, HTMLLIElement>>(new Map());

  const filtered: SucursalWithDistance[] = sucursales
    .filter((s: Sucursal) => s.activa)
    .filter((s: Sucursal) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.nombre.toLowerCase().includes(q) ||
        s.direccion.toLowerCase().includes(q) ||
        (s.barrio?.toLowerCase().includes(q) ?? false) ||
        s.ciudad.toLowerCase().includes(q)
      );
    })
    .map((s: Sucursal) => ({
      ...s,
      distance: userLocation
        ? haversineDistance(userLocation.lat, userLocation.lng, s.lat, s.lng)
        : null,
    }))
    .sort((a: SucursalWithDistance, b: SucursalWithDistance) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return 0;
    });

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        const nearest = sucursales
          .filter((s: Sucursal) => s.activa)
          .map((s: Sucursal) => ({
            id: s.id,
            distance: haversineDistance(loc.lat, loc.lng, s.lat, s.lng),
          }))
          .sort((a: { id: string; distance: number }, b: { id: string; distance: number }) => a.distance - b.distance)[0];
        if (nearest) setSelectedId(nearest.id);
      },
      () => {},
    );
  }, [sucursales]);

  const handleSelectBranch = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    handleUseLocation();
  }, [handleUseLocation]);

  useEffect(() => {
    if (!selectedId) return;
    itemRefsMap.current.get(selectedId)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  return (
    <main className={styles.container}>
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>Encontrá tu sucursal más cercana</h1>
          <p className={styles.subtitle}>
            {isSucursalesLoading
              ? "Cargando…"
              : `${filtered.length} sucursal${filtered.length !== 1 ? "es" : ""} disponible${filtered.length !== 1 ? "s" : ""}${userLocation ? " · ordenadas por cercanía" : ""}`}
          </p>
        </div>
      </section>

      <div className={styles.storeLocator}>
        <div className={styles.mapOuter}>
          <div className={styles.mapWrapper}>
            <LeafletMap
              branches={filtered}
              selectedId={selectedId}
              onSelectBranch={handleSelectBranch}
              userLocation={userLocation}
              centerUserTrigger={centerUserTrigger}
            />
          </div>
          <button
            type="button"
            className={styles.locateButton}
            onClick={() => {
              if (userLocation) {
                setCenterUserTrigger((n) => n + 1);
              } else {
                handleUseLocation();
              }
            }}
            title="Ir a mi ubicación"
            aria-label="Ir a mi ubicación"
          >
            <Navigation size={17} />
          </button>
        </div>

        <div className={styles.listColumn}>
          <div className={styles.searchRow}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery("")}
              placeholder="Buscar por nombre o dirección…"
            />
          </div>
        <div className={styles.listWrapper}>
          {isSucursalesLoading ? (
            <ul className={styles.branchList}>
              {[52, 68, 44].map((nameW) => (
                <li key={nameW} className={styles.skeletonCard}>
                  <div className={styles.skeletonCardTop}>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className={SKELETON_BLOCK} style={{ height: "0.875rem", width: `${nameW}%` }} />
                      <Skeleton className={SKELETON_BLOCK} style={{ height: "0.75rem", width: "70%" }} />
                      <Skeleton className={SKELETON_BLOCK} style={{ height: "0.7rem", width: "40%" }} />
                    </div>
                  </div>
                  <Skeleton className={SKELETON_BLOCK} style={{ height: "0.7rem", width: "55%" }} />
                  <div className={styles.skeletonBadges}>
                    <Skeleton className={`${SKELETON_BLOCK} h-5 w-22 rounded-full`} />
                    <Skeleton className={`${SKELETON_BLOCK} h-5 w-16 rounded-full`} />
                  </div>
                </li>
              ))}
            </ul>
          ) : sucursalesError ? (
            <Alert icon={<CircleAlert size={18} />}>{sucursalesError}</Alert>
          ) : filtered.length === 0 ? (
            <EmptyState
              variant="plain"
              icon={MapPin}
              text="No encontramos sucursales con ese criterio."
              action={
                <button
                  type="button"
                  className={styles.emptyReset}
                  onClick={() => setSearchQuery("")}
                >
                  Limpiar búsqueda
                </button>
              }
            />
          ) : (
            <ul className={styles.branchList}>
              {filtered.map((branch, index) => {
                const isSelected = branch.id === selectedId;
                const isNearest = userLocation !== null && index === 0;
                return (
                  <li
                    key={branch.id}
                    ref={(el) => {
                      if (el) itemRefsMap.current.set(branch.id, el);
                      else itemRefsMap.current.delete(branch.id);
                    }}
                  >
                    <button
                      type="button"
                      className={`${styles.branchCard} ${isSelected ? styles.branchCardActive : ""}`}
                      onClick={() => handleSelectBranch(branch.id)}
                    >
                      <div className={styles.branchCardTop}>
                        <div className={styles.branchInfo}>
                          <div className={styles.branchNameRow}>
                            <p className={styles.branchName}>{branch.nombre}</p>
                            {isNearest && (
                              <Badge color="solid">Más cercana</Badge>
                            )}
                          </div>
                          <p className={styles.branchAddress}>{branch.direccion}</p>
                          {branch.barrio ? (
                            <p className={styles.branchBarrio}>{branch.barrio} · {branch.ciudad}</p>
                          ) : (
                            <p className={styles.branchBarrio}>{branch.ciudad}</p>
                          )}
                        </div>
                        {branch.distance !== null && (
                          <span className={styles.branchDistance}>
                            {formatDistance(branch.distance)}
                          </span>
                        )}
                      </div>

                      {branch.horarios && (
                        <p className={styles.branchHorarios}>{branch.horarios}</p>
                      )}

                      {branch.servicios && branch.servicios.length > 0 && (
                        <div className={styles.branchBadges}>
                          {branch.servicios.map((s) => (
                            <Badge key={s}>{s}</Badge>
                          ))}
                        </div>
                      )}
                    </button>

                    {isSelected && (
                      <div className={styles.branchActions}>
                        <a
                          href={getGoogleMapsUrl(branch.lat, branch.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.actionBtn}
                        >
                          <ExternalLink size={14} />
                          Cómo llegar
                        </a>
                        {branch.telefono && (
                          <a href={`tel:${branch.telefono.replace(/\s/g, "")}`} className={styles.actionBtn}>
                            <Phone size={14} />
                            Llamar
                          </a>
                        )}
                        {branch.whatsapp && (
                          <a
                            href={getWhatsAppUrl(branch.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.actionBtn} ${styles.actionBtnWa}`}
                          >
                            <MessageCircle size={14} />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        </div>
      </div>
    </main>
  );
}
