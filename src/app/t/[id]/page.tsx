"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ItemActions, ItemCard } from "@/components/ItemCard";
import { ItemForm } from "@/components/ItemForm";
import { IconArrow, IconCheck } from "@/components/Icons";
import { useTrip } from "@/components/TripProvider";
import { ars, useDolar } from "@/components/useDolar";
import { describe, useWeather } from "@/components/useWeather";
import { CATEGORIES } from "@/lib/categories";
import { dayLabel, daysBetween, endMinutes, fmtDuration, nowInTrip, sortItems, toMin } from "@/lib/time";
import type { Item } from "@/lib/types";

const dayDiff = (a: string, b: string) =>
  Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000);

export default function NowPage() {
  const { bundle, me, save } = useTrip();
  const [now, setNow] = useState(nowInTrip);
  const [editing, setEditing] = useState<Item | null>(null);
  const { trip, items, packing } = bundle!;
  const weather = useWeather(trip.lat, trip.lng);
  const dolar = useDolar();

  useEffect(() => {
    const t = setInterval(() => setNow(nowInTrip()), 30000);
    return () => clearInterval(t);
  }, []);

  const scheduled = useMemo(() => sortItems(items.filter((i) => i.day)), [items]);
  const days = daysBetween(trip.startDate, trip.endDate);
  const phase = now.day < trip.startDate ? "antes" : now.day > trip.endDate ? "despues" : "durante";

  // Qué está pasando y qué viene.
  let current: Item | undefined;
  let next: Item | undefined;
  for (let i = 0; i < scheduled.length; i++) {
    const it = scheduled[i];
    const nxt = scheduled[i + 1];
    if (it.day < now.day) continue;
    if (it.day === now.day && toMin(it.start) <= now.minutes && now.minutes < endMinutes(it, nxt)) current = it;
    if (it.day > now.day || toMin(it.start) > now.minutes) {
      next = it;
      break;
    }
  }
  const minsToNext = next ? dayDiff(now.day, next.day) * 1440 + toMin(next.start) - now.minutes : 0;
  const restToday = scheduled.filter(
    (i) => i.day === now.day && i !== current && i !== next && toMin(i.start) > now.minutes,
  );

  const mine = packing.filter((p) => !p.who || p.who === me);
  const packed = mine.filter((p) => p.packed).length;

  const eventToday = scheduled.find((i) => i.day === now.day && i.category === "evento");
  const concertList = packing
    .filter((p) => /concierto|show|recital/i.test(p.list) && (!p.who || p.who === me))
    .sort((a, b) => a.order - b.order);

  const todayIdx = days.indexOf(now.day);
  const w = weather[phase === "antes" ? trip.startDate : now.day];
  const blue = dolar.find((d) => d.casa === "blue");

  return (
    <main className="now">
      <header className="page-head">
        <p className="eyebrow">
          {trip.destination}
          {phase === "durante" && ` · día ${todayIdx + 1} de ${days.length}`}
        </p>
        <h1 className="display">
          {phase === "antes" && (dayDiff(now.day, trip.startDate) === 1 ? "Mañana arranca" : `Faltan ${dayDiff(now.day, trip.startDate)} días`)}
          {phase === "durante" && `${capitalize(dayLabel(now.day).weekday)} ${dayLabel(now.day).num}`}
          {phase === "despues" && "Ya volvimos"}
        </h1>
        <div className="meta-row">
          {w && (
            <span className="meta">
              <b>{w.max}°</b>/{w.min}° {describe(w.code).toLowerCase()}
              {w.rain >= 30 && ` · ${w.rain}% lluvia`}
            </span>
          )}
          {blue && <span className="meta">Blue <b>{ars(blue.venta)}</b></span>}
        </div>
      </header>

      {phase === "antes" && (
        <section className="stack">
          <Link href={`/t/${trip.id}/valija`} className="card progress-card">
            <div className="grow">
              <span className="eyebrow">Tu valija</span>
              <strong>
                {mine.length ? `${packed} de ${mine.length} cosas listas` : "Todavía no armaste la lista"}
              </strong>
              <div className="bar">
                <i style={{ width: `${mine.length ? (packed / mine.length) * 100 : 0}%` }} />
              </div>
            </div>
            <IconArrow />
          </Link>
          {scheduled[0] && (
            <>
              <h2 className="section-title">Lo primero</h2>
              <Slot label={`${capitalize(dayLabel(scheduled[0].day).weekday)} · ${scheduled[0].start}`}>
                <ItemCard item={scheduled[0]} onClick={() => setEditing(scheduled[0])} />
              </Slot>
            </>
          )}
        </section>
      )}

      {phase === "durante" && (
        <section className="stack">
          {current ? (
            <NowCard item={current} now={now.minutes} next={scheduled[scheduled.indexOf(current) + 1]} onClick={() => setEditing(current!)} />
          ) : (
            <div className="card free">
              <span className="eyebrow">Ahora</span>
              <strong>Tiempo libre{next && next.day === now.day ? ` hasta las ${next.start}` : ""}</strong>
            </div>
          )}

          {next && (
            <Slot label={`Después · ${minsToNext < 1440 ? `en ${fmtDuration(minsToNext)}` : dayLabel(next.day).weekday} · ${next.start}`}>
              <ItemCard item={next} onClick={() => setEditing(next!)} />
            </Slot>
          )}

          {eventToday && concertList.length > 0 && (
            <div className="card checklist">
              <span className="eyebrow">Para {eventToday.title}</span>
              <ul>
                {concertList.map((p) => (
                  <li key={p.id}>
                    <button className={`check ${p.packed ? "on" : ""}`} onClick={() => save("packing", { ...p, packed: !p.packed })}>
                      <span className="box">{p.packed && <IconCheck size={14} />}</span>
                      {p.text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {restToday.length > 0 && (
            <>
              <h2 className="section-title">Más tarde</h2>
              <ul className="mini-list">
                {restToday.map((i) => (
                  <li key={i.id} onClick={() => setEditing(i)} style={{ "--cat": CATEGORIES[i.category].color } as React.CSSProperties}>
                    <span className="mono">{i.start}</span>
                    <span className="dot" />
                    <span className="grow">{i.title}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!current && !next && <p className="muted center">No queda nada agendado. A descansar.</p>}
          <Link className="btn ghost" href={`/t/${trip.id}/plan?dia=${now.day}`}>
            Ver el día completo <IconArrow />
          </Link>
        </section>
      )}

      {phase === "despues" && (
        <section className="stack">
          <p className="muted">
            {scheduled.length} actividades en {days.length} días. Si querés reusar la valija para el próximo viaje, guardala como plantilla
            desde la pestaña Valija.
          </p>
          <Link className="btn" href={`/t/${trip.id}/plan`}>
            Ver el cronograma
          </Link>
        </section>
      )}

      {editing && <ItemForm item={editing} onClose={() => setEditing(null)} />}
    </main>
  );
}

function NowCard({ item, now, next, onClick }: { item: Item; now: number; next?: Item; onClick: () => void }) {
  const start = toMin(item.start);
  const end = endMinutes(item, next);
  const pct = Math.min(100, Math.max(0, ((now - start) / Math.max(1, end - start)) * 100));
  const cat = CATEGORIES[item.category];
  return (
    <article className="card now-card" style={{ "--cat": cat.color } as React.CSSProperties} onClick={onClick}>
      <span className="eyebrow">Ahora · {cat.label}</span>
      <h2>{item.title}</h2>
      {item.place && item.place.name !== item.title && <p className="muted">{item.place.name}</p>}
      <div className="bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="row between mono small">
        <span>{item.start}</span>
        <span>{end - now > 0 ? `quedan ${fmtDuration(end - now)}` : ""}</span>
        <span>{item.end ?? (next && next.day === item.day ? next.start : "")}</span>
      </div>
      {item.notes && <p className="notes">{item.notes}</p>}
      <ItemActions item={item} />
    </article>
  );
}

function Slot({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="slot">
      <span className="slot-label">{label}</span>
      {children}
    </div>
  );
}

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);
