"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TrackData } from "./TrackView";

// Fix Leaflet's default icon URLs (Next bundler breaks them).
const defaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const pickupIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#10b981;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const dropIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const driverIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#f16c1e;border:3px solid white;box-shadow:0 2px 6px rgba(241,108,30,0.5);animation:pulse 2s ease-in-out infinite"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points.map((p) => p.join(",")).join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function TrackMap({ data }: { data: TrackData }) {
  // Default marker icon (so TypeScript is happy elsewhere).
  L.Marker.prototype.options.icon = defaultIcon;

  // Guard against React Strict Mode's double-mount: defer rendering the
  // MapContainer to the next tick so the first Leaflet init is complete
  // before we (possibly) remount in dev.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  const pickup: [number, number] = [data.pickup.lat, data.pickup.lng];
  const drop: [number, number] = [data.drop.lat, data.drop.lng];
  const driver =
    data.driver && data.driver.lat !== null && data.driver.lng !== null
      ? ([data.driver.lat, data.driver.lng] as [number, number])
      : null;

  const allPoints = useMemo(() => {
    const p: [number, number][] = [pickup, drop];
    if (driver) p.push(driver);
    return p;
  }, [pickup[0], pickup[1], drop[0], drop[1], driver?.[0], driver?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  const routeLine: [number, number][] = driver
    ? data.status === "IN_TRIP" || data.status === "EN_ROUTE"
      ? [driver, drop]
      : [driver, pickup]
    : [pickup, drop];

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 text-xs text-slate-400">
        Loading map…
      </div>
    );
  }

  return (
    <MapContainer
      center={pickup}
      zoom={13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={pickup} icon={pickupIcon}>
        <Popup>Pickup: {data.pickup.address}</Popup>
      </Marker>
      <Marker position={drop} icon={dropIcon}>
        <Popup>Drop: {data.drop.address}</Popup>
      </Marker>
      {driver && (
        <Marker position={driver} icon={driverIcon}>
          <Popup>
            <b>{data.driver?.name}</b>
            <br />
            {data.driver?.phone}
          </Popup>
        </Marker>
      )}
      <Polyline
        positions={routeLine}
        pathOptions={{
          color: "#f16c1e",
          weight: 4,
          opacity: 0.6,
          dashArray: driver ? "8 8" : undefined,
        }}
      />
      <FitBounds points={allPoints} />
    </MapContainer>
  );
}
