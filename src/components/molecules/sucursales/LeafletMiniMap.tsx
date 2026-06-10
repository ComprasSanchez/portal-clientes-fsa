"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Sucursal } from "@/types/sucursal";

const CORDOBA_CENTER: [number, number] = [-31.4167, -64.1833];

const PIN_ICON = L.divIcon({
  html: `<div style="
    width:9px;height:9px;border-radius:50%;
    background:#0B87A0;
    border:2px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.28);
  "></div>`,
  className: "",
  iconSize: [9, 9],
  iconAnchor: [4, 4],
});

interface LeafletMiniMapProps {
  branches: Sucursal[];
}

export function LeafletMiniMap({ branches }: LeafletMiniMapProps) {
  return (
    <MapContainer
      center={CORDOBA_CENTER}
      zoom={11}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom={false}
      touchZoom={false}
      doubleClickZoom={false}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        maxZoom={19}
      />
      {branches.filter((b) => b.activa).map((branch) => (
        <Marker
          key={branch.id}
          position={[branch.lat, branch.lng]}
          icon={PIN_ICON}
        />
      ))}
    </MapContainer>
  );
}
