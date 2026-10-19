"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { dayLabel, nowInTrip } from "@/lib/time";
import type { Trip } from "@/lib/types";
import { IconArrow } from "./Icons";
import { rememberTrip } from "./TripProvider";

export function Home({ needsPassword }: { needsPassword: boolean }) {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [joinLink, setJoinLink] = useState("");
  const today = nowInTrip().day;

  useEffect(() => {
    try {
      setTrips(JSON.parse(localStorage.getItem("travel:trips") || "[]"));
    } catch {}
  }, []);

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    setErr(null);
    try {
      // Coordenadas del destino para el clima y para centrar el mapa.
      let coords = {};
      if (f.destination) {
        const r = await fetch(`/api/place?q=${encodeURIComponent(f.destination)}`).catch(() => null);
        const [hit] = r?.ok ? await r.json() : [];
        if (hit) coords = { lat: hit.lat, lng: hit.lng };
      }
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, ...coords }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      rememberTrip(data);
      localStorage.setItem(`travel:me:${data.id}`, f.me);
      router.push(`/t/${data.id}`);
    } catch (e) {
      setErr((e as Error).message || "No se pudo crear");
      setBusy(false);
    }
  };

  const upcoming = trips.filter((t) => t.endDate >= today);
  const past = trips.filter((t) => t.endDate < today);

  return (
    <main className="home">
      <header>
        <p className="eyebrow">Bitácora</p>
        <h1 className="display xl">
          Todo el viaje,
          <br />
          <em>en el bolsillo.</em>
        </h1>
      </header>

      {upcoming.length > 0 && (
        <section>
          <h2 className="section-title">Próximos</h2>
          <ul className="trip-list">
            {upcoming.map((t) => (
              <TripRow key={t.id} t={t} />
            ))}
          </ul>
        </section>
      )}

      {!creating ? (
        <button className="btn primary wide" onClick={() => setCreating(true)}>
          Armar un viaje nuevo
        </button>
      ) : (
        <form className="card stack" onSubmit={create}>
          <span className="eyebrow">Viaje nuevo</span>
          <label className="field">
            <span>Nombre</span>
            <input name="name" required placeholder="Finde en Buenos Aires" autoFocus />
          </label>
          <label className="field">
            <span>Ciudad</span>
            <input name="destination" required placeholder="Buenos Aires" />
          </label>
          <div className="grid2">
            <label className="field">
              <span>Desde</span>
              <input name="startDate" type="date" required />
            </label>
            <label className="field">
              <span>Hasta</span>
              <input name="endDate" type="date" required />
            </label>
          </div>
          <label className="field">
            <span>Tu nombre</span>
            <input name="me" required placeholder="Como te van a ver las demás personas" />
          </label>
          {needsPassword && (
            <label className="field">
              <span>Contraseña de la app</span>
              <input name="password" type="password" required />
            </label>
          )}
          {err && <p className="hint err">{err}</p>}
          <button className="btn primary" disabled={busy}>
            {busy ? "Creando…" : "Crear"}
          </button>
        </form>
      )}

      <form
        className="join"
        onSubmit={(e) => {
          e.preventDefault();
          const id = joinLink.trim().match(/\/t\/([a-z0-9]+)/)?.[1] ?? joinLink.trim();
          if (id) router.push(`/t/${id}`);
        }}
      >
        <span className="eyebrow">¿Te pasaron un link?</span>
        <div className="row">
          <input value={joinLink} onChange={(e) => setJoinLink(e.target.value)} placeholder="Pegalo acá" />
          <button className="btn">Abrir</button>
        </div>
      </form>

      {past.length > 0 && (
        <section>
          <h2 className="section-title">Viajes anteriores</h2>
          <ul className="trip-list past">
            {past.map((t) => (
              <TripRow key={t.id} t={t} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function TripRow({ t }: { t: Trip }) {
  const a = dayLabel(t.startDate);
  const b = dayLabel(t.endDate);
  return (
    <li>
      <Link href={`/t/${t.id}`}>
        <div className="date-block mono">
          <b>{a.num}</b>
          <small>{a.short.split(" ")[1]}</small>
        </div>
        <div className="grow">
          <strong>{t.name}</strong>
          <small>
            {t.destination} · {a.short} – {b.short}
          </small>
        </div>
        <IconArrow />
      </Link>
    </li>
  );
}
