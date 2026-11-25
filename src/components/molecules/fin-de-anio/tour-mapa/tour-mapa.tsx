"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PAPA_NOEL_IMAGEN, puntoDelAvance, type PuntoMapa } from "@/lib/tour-papa-noel";
import styles from "./tour-mapa.module.scss";

type TourMapaProps = {
  /** Paradas en el orden del recorrido. */
  puntos: PuntoMapa[];
  /** Por dónde va Papá Noel (en paradas: 1.5 = mitad entre la 2ª y la 3ª). */
  avance: number | null;
};

const DURACION_TRAMO_MS = 2000;
const DURACION_MAX_MS = 6000;
const CORDOBA: [number, number] = [-31.4167, -64.1833];

const iconoParada = (numero: number, destacada: boolean) =>
  L.divIcon({
    html: `<span class="${styles.pin} ${destacada ? styles.pinDestacado : ""}">${numero}</span>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

const ICONO_PAPA_NOEL = L.divIcon({
  // Ancho en línea: el CSS de Leaflet pisa el de las imágenes de los marcadores.
  html: `<img src="${PAPA_NOEL_IMAGEN}" alt="Papá Noel" class="${styles.papaNoel}" style="width:56px;height:auto" />`,
  className: "",
  iconSize: [56, 67],
  iconAnchor: [28, 60],
});

function Encuadre({ puntos }: { puntos: PuntoMapa[] }) {
  const map = useMap();
  useEffect(() => {
    if (!puntos.length) return;
    map.fitBounds(L.latLngBounds(puntos.map((p) => [p.lat, p.lng])), { padding: [48, 48], maxZoom: 14 });
  }, [map, puntos]);
  return null;
}

/** Mueve el auto por la línea hasta el avance nuevo (la primera vez, desde la salida). */
function PapaNoel({ puntos, avance }: { puntos: PuntoMapa[]; avance: number }) {
  const marker = useRef<L.Marker | null>(null);
  const actual = useRef(0);

  useEffect(() => {
    const desde = actual.current;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Más tramos, más tiempo (con tope), para que el viaje se vea.
    const duracion = Math.min(DURACION_MAX_MS, Math.max(600, Math.abs(avance - desde) * DURACION_TRAMO_MS));
    const inicio = performance.now();
    let frame = 0;
    const paso = (ahora: number) => {
      const t = reducido ? 1 : Math.min(1, (ahora - inicio) / duracion);
      const suave = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const antes = puntoDelAvance(puntos, actual.current);
      actual.current = desde + (avance - desde) * suave;
      const { lat, lng } = puntoDelAvance(puntos, actual.current);
      marker.current?.setLatLng([lat, lng]);
      // El auto mira hacia donde va (el dibujo mira a la derecha).
      const img = marker.current?.getElement()?.querySelector("img");
      if (img && lng !== antes.lng) img.style.transform = lng < antes.lng ? "scaleX(-1)" : "";
      if (t < 1) frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [puntos, avance]);

  // Arranca en la primera parada; después lo mueve solo el efecto.
  const [inicial] = useState(() => puntoDelAvance(puntos, 0));
  return (
    <Marker
      ref={marker}
      position={[inicial.lat, inicial.lng]}
      icon={ICONO_PAPA_NOEL}
      zIndexOffset={1000}
      interactive={false}
    />
  );
}

/** Mapa del tour: solo las sucursales del recorrido, numeradas, y Papá Noel viajando. */
export default function TourMapa({ puntos, avance }: TourMapaProps) {
  const linea = useMemo(() => puntos.map((p) => [p.lat, p.lng] as [number, number]), [puntos]);

  return (
    <div className={styles.mapa}>
      <MapContainer center={CORDOBA} zoom={12} style={{ width: "100%", height: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />
        <Encuadre puntos={puntos} />
        <Polyline positions={linea} pathOptions={{ color: "#0b7690", weight: 4, dashArray: "2 10", lineCap: "round" }} />
        {puntos.map((p, i) => (
          <Marker key={p.orden} position={[p.lat, p.lng]} icon={iconoParada(i + 1, p.destacada)} />
        ))}
        {avance !== null && <PapaNoel puntos={puntos} avance={avance} />}
      </MapContainer>
    </div>
  );
}
