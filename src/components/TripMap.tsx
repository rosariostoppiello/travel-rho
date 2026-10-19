"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { CATEGORY_HEX } from "@/lib/categories";
import type { Item } from "@/lib/types";
import { directionsUrl } from "./ItemCard";

export interface Pin {
  item: Item;
  label: string; // número de orden o inicial
}

const icon = (color: string, label: string, active: boolean) =>
  L.divIcon({
    className: "",
    html: `<div class="pin${active ? " active" : ""}" style="--pin:${color}"><span>${label}</span></div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    popupAnchor: [0, -32],
  });

function Fit({ points, focus }: { points: [number, number][]; focus?: [number, number] }) {
  const map = useMap();
  const key = points.map((p) => p.join()).join("|");
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], 15);
    else map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (focus) map.flyTo(focus, Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [focus, map]);
  return null;
}

export default function TripMap({
  pins,
  route,
  focusId,
  center,
}: {
  pins: Pin[];
  route?: boolean;
  focusId?: string;
  center?: [number, number];
}) {
  const markers = useRef<Record<string, L.Marker | null>>({});
  const located = pins.filter((p) => p.item.place?.lat !== undefined);
  const points = useMemo(
    () => located.map((p) => [p.item.place!.lat!, p.item.place!.lng!] as [number, number]),
    [located],
  );
  const focusPin = located.find((p) => p.item.id === focusId);
  const focus = focusPin ? ([focusPin.item.place!.lat!, focusPin.item.place!.lng!] as [number, number]) : undefined;

  useEffect(() => {
    if (focusId) markers.current[focusId]?.openPopup();
  }, [focusId]);

  return (
    <MapContainer
      center={points[0] ?? center ?? [-34.6037, -58.3816]}
      zoom={13}
      className="leaflet-host"
      zoomControl={false}
      attributionControl
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />
      {route && points.length > 1 && (
        <Polyline positions={points} pathOptions={{ color: "#2b2620", weight: 2.5, opacity: 0.55, dashArray: "2 7" }} />
      )}
      {located.map((p) => (
        <Marker
          key={p.item.id}
          position={[p.item.place!.lat!, p.item.place!.lng!]}
          icon={icon(CATEGORY_HEX[p.item.category], p.label, p.item.id === focusId)}
          ref={(m) => {
            markers.current[p.item.id] = m;
          }}
        >
          <Popup>
            <div className="popup">
              <span className="mono">{p.item.day ? p.item.start : "idea"}</span>
              <strong>{p.item.title}</strong>
              {p.item.place?.name !== p.item.title && <small>{p.item.place?.name}</small>}
              <a href={directionsUrl(p.item)!} target="_blank" rel="noreferrer">
                Cómo llegar →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
      <Fit points={points} focus={focus} />
    </MapContainer>
  );
}
