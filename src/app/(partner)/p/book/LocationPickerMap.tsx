"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

function Recenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14);
  }, [map, center?.[0], center?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPickerMap({
  center,
  pin,
  color,
  onPick,
}: {
  center: [number, number];
  pin: [number, number] | null;
  color: string;
  onPick: (lat: number, lng: number) => void;
}) {
  // Guard against Strict Mode's double-mount.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 text-xs text-slate-400">
        Loading map…
      </div>
    );
  }

  return (
    <MapContainer
      center={pin ?? center}
      zoom={pin ? 15 : 13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <Recenter center={pin} />
      {pin && <Marker position={pin} icon={pinIcon(color)} />}
    </MapContainer>
  );
}
