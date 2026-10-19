"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useTrip } from "@/components/TripProvider";
import { CATEGORIES } from "@/lib/categories";
import { dayLabel, daysBetween, sortItems } from "@/lib/time";
import type { Pin } from "@/components/TripMap";

const TripMap = dynamic(() => import("@/components/TripMap"), {
  ssr: false,
  loading: () => <div className="leaflet-host placeholder" />,
});

export default function MapPage() {
  return (
    <Suspense>
      <MapView />
    </Suspense>
  );
}

function MapView() {
  const { bundle } = useTrip();
  const { trip, items } = bundle!;
  const params = useSearchParams();
  const days = daysBetween(trip.startDate, trip.endDate);
  const [day, setDay] = useState<string | null>(params.get("dia"));
  const [focus, setFocus] = useState<string>();

  const pins: Pin[] = useMemo(() => {
    const sorted = sortItems(items).filter((i) => i.place?.lat !== undefined);
    if (day) return sorted.filter((i) => i.day === day).map((item, n) => ({ item, label: String(n + 1) }));
    // En el mapa general la etiqueta es el número de día (o "·" si es una idea).
    return sorted.map((item) => ({ item, label: item.day ? String(days.indexOf(item.day) + 1) : "·" }));
  }, [items, day, days]);

  const missing = items.filter((i) => (!day || i.day === day) && i.place && i.place.lat === undefined);

  return (
    <main className="map-page">
      <header className="page-head">
        <p className="eyebrow">{trip.destination}</p>
        <h1 className="display">{day ? `${cap(dayLabel(day).weekday)} ${dayLabel(day).num}` : "Mapa"}</h1>
      </header>
      <div className="chips scroll">
        <button className={`chip ${!day ? "on" : ""}`} onClick={() => (setDay(null), setFocus(undefined))}>
          Todo
        </button>
        {days.map((d, i) => (
          <button key={d} className={`chip ${day === d ? "on" : ""}`} onClick={() => (setDay(d), setFocus(undefined))}>
            Día {i + 1} · {dayLabel(d).weekday.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="map-frame">
        <TripMap pins={pins} route={!!day} focusId={focus} center={trip.lat ? [trip.lat, trip.lng!] : undefined} />
      </div>

      {pins.length === 0 ? (
        <p className="muted center pad">
          Todavía no hay lugares con pin {day ? "este día" : ""}. Al cargar una actividad, pegá el link de Google Maps del lugar.
        </p>
      ) : (
        <ol className="pin-list">
          {pins.map((p) => (
            <li key={p.item.id} style={{ "--cat": CATEGORIES[p.item.category].color } as React.CSSProperties}>
              <button className={focus === p.item.id ? "on" : ""} onClick={() => setFocus(p.item.id)}>
                <span className="pin-badge">{p.label}</span>
                <span className="grow">
                  <strong>{p.item.title}</strong>
                  <small>
                    {p.item.day ? `${day ? "" : dayLabel(p.item.day).weekday + " "}${p.item.start}` : "idea"} · {CATEGORIES[p.item.category].label}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {missing.length > 0 && (
        <p className="muted small pad">Sin pin: {missing.map((i) => i.title).join(", ")}.</p>
      )}
    </main>
  );
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
