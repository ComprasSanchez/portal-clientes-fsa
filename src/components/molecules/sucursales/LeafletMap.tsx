"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SucursalWithDistance } from "@/types/sucursal";

interface LeafletMapProps {
  branches: SucursalWithDistance[];
  selectedId: string | null;
  onSelectBranch: (id: string) => void;
  userLocation: { lat: number; lng: number } | null;
  centerUserTrigger: number;
}

const CORDOBA_CENTER: [number, number] = [-31.4167, -64.1833];

function createPinIcon(active: boolean) {
  const size = active ? 22 : 16;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${active ? "#F2C23D" : "#0B87A0"};
      border:3px solid ${active ? "#d4a500" : "white"};
      box-shadow:${active ? "0 4px 14px rgba(242,194,61,0.6)" : "0 2px 8px rgba(0,0,0,0.22)"};
    "></div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const USER_ICON = L.divIcon({
  html: `<div style="
    position:relative;width:22px;height:22px;
    display:flex;align-items:center;justify-content:center;
  ">
    <div style="
      position:absolute;width:22px;height:22px;border-radius:50%;
      background:rgba(59,130,246,0.18);
    "></div>
    <div style="
      width:13px;height:13px;border-radius:50%;
      background:#3b82f6;border:2.5px solid white;
      box-shadow:0 2px 8px rgba(59,130,246,0.55);
    "></div>
  </div>`,
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function MapController({
  selectedId,
  branches,
  userLocation,
  centerUserTrigger,
}: {
  selectedId: string | null;
  branches: SucursalWithDistance[];
  userLocation: { lat: number; lng: number } | null;
  centerUserTrigger: number;
}) {
  const map = useMap();

  // Fly to selected branch when it changes
  useEffect(() => {
    if (!selectedId) return;
    const branch = branches.find((b) => b.id === selectedId);
    if (!branch) return;
    map.flyTo([branch.lat, branch.lng], 14, { duration: 1 });
  }, [selectedId, branches, map]);

  // When user location is set, fit bounds to show user + nearest branch together
  useEffect(() => {
    if (!userLocation || branches.length === 0) return;
    const nearest = branches[0];
    if (!nearest) return;
    const bounds = L.latLngBounds(
      [userLocation.lat, userLocation.lng],
      [nearest.lat, nearest.lng],
    );
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
  }, [userLocation, map]); // eslint-disable-line react-hooks/exhaustive-deps

  // Center on user when the locate button is pressed
  useEffect(() => {
    if (!centerUserTrigger || !userLocation) return;
    map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 });
  }, [centerUserTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export function LeafletMap({ branches, selectedId, onSelectBranch, userLocation, centerUserTrigger }: LeafletMapProps) {
  return (
    <MapContainer
      center={CORDOBA_CENTER}
      zoom={11}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        maxZoom={19}
      />
      <MapController selectedId={selectedId} branches={branches} userLocation={userLocation} centerUserTrigger={centerUserTrigger} />

      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={USER_ICON}
        />
      )}

      {branches.map((branch) => (
        <Marker
          key={branch.id}
          position={[branch.lat, branch.lng]}
          icon={createPinIcon(branch.id === selectedId)}
          eventHandlers={{ click: () => onSelectBranch(branch.id) }}
        />
      ))}
    </MapContainer>
  );
}
