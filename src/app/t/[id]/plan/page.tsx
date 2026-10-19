"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ItemCard, placeUrl } from "@/components/ItemCard";
import { blankItem, ItemForm } from "@/components/ItemForm";
import { CategoryIcon, IconMap, IconPlus } from "@/components/Icons";
import { useTrip } from "@/components/TripProvider";
import { describe, useWeather } from "@/components/useWeather";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
import { dayLabel, daysBetween, fmtDuration, nowInTrip, sortItems, toMin } from "@/lib/time";
import type { Category, Item } from "@/lib/types";

export default function PlanPage() {
  return (
    <Suspense>
      <Plan />
    </Suspense>
  );
}

function Plan() {
  const { bundle } = useTrip();
  const { trip, items } = bundle!;
  const params = useSearchParams();
  const days = daysBetween(trip.startDate, trip.endDate);
  const today = nowInTrip().day;
  const initial = params.get("dia") ?? (days.includes(today) ? today : days[0]);
  const [day, setDay] = useState(initial);
  const [view, setView] = useState<"dias" | "lugares">(params.get("vista") === "lugares" ? "lugares" : "dias");
  const [filter, setFilter] = useState<Category | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const weather = useWeather(trip.lat, trip.lng);

  const sorted = useMemo(() => sortItems(items), [items]);
  const ofDay = sorted.filter((i) => i.day === day && (!filter || i.category === filter));
  const usedCats = CATEGORY_ORDER.filter((c) => items.some((i) => i.category === c));

  const addAfter = () => {
    const last = sorted.filter((i) => i.day === day).at(-1);
    const start = last ? last.end ?? addMinutes(last.start, 60) : "10:00";
    setEditing(blankItem(day ?? "", start));
  };

  return (
    <main>
      <header className="page-head">
        <p className="eyebrow">{trip.name}</p>
        <div className="row between">
          <h1 className="display">Plan</h1>
          <div className="segmented">
            <button className={view === "dias" ? "on" : ""} onClick={() => setView("dias")}>
              Por día
            </button>
            <button className={view === "lugares" ? "on" : ""} onClick={() => setView("lugares")}>
              Lugares
            </button>
          </div>
        </div>
      </header>

      {view === "dias" && (
        <>
          <div className="day-strip" role="tablist">
            {days.map((d) => {
              const l = dayLabel(d);
              const w = weather[d];
              return (
                <button key={d} role="tab" aria-selected={d === day} className={d === day ? "on" : ""} onClick={() => setDay(d)}>
                  <small>{l.weekday.slice(0, 3)}</small>
                  <b>{l.num}</b>
                  {w ? <small className="mono">{w.max}°</small> : <small>&nbsp;</small>}
                  {d === today && <i className="today-dot" />}
                </button>
              );
            })}
          </div>

          <div className="day-tools">
            <p className="muted small">
              {weather[day] && `${describe(weather[day].code)}, ${weather[day].min}° a ${weather[day].max}°`}
              {weather[day]?.rain >= 30 && ` · ${weather[day].rain}% de lluvia, llevá paraguas`}
            </p>
            <Link className="pill" href={`/t/${trip.id}/mapa?dia=${day}`}>
              <IconMap size={15} /> Mapa del día
            </Link>
          </div>

          {usedCats.length > 1 && (
            <div className="chips scroll">
              <button className={`chip ${!filter ? "on" : ""}`} onClick={() => setFilter(null)}>
                Todo
              </button>
              {usedCats.map((c) => (
                <button
                  key={c}
                  className={`chip cat ${filter === c ? "on" : ""}`}
                  style={{ "--cat": CATEGORIES[c].color } as React.CSSProperties}
                  onClick={() => setFilter(filter === c ? null : c)}
                >
                  <CategoryIcon c={c} size={14} /> {CATEGORIES[c].label}
                </button>
              ))}
            </div>
          )}

          <Timeline items={ofDay} onOpen={setEditing} />
          {ofDay.length === 0 && (
            <div className="empty">
              <p>Nada planeado {filter ? `de ${CATEGORIES[filter].label.toLowerCase()} ` : ""}para este día.</p>
              <button className="btn" onClick={addAfter}>
                Agregar algo
              </button>
            </div>
          )}
        </>
      )}

      {view === "lugares" && <Places items={sorted} onOpen={setEditing} />}

      <button className="fab" onClick={view === "lugares" ? () => setEditing(blankItem("")) : addAfter} aria-label="Agregar actividad">
        <IconPlus size={24} />
      </button>
      {editing && <ItemForm item={editing} onClose={() => setEditing(null)} />}
    </main>
  );
}

function Timeline({ items, onOpen }: { items: Item[]; onOpen: (i: Item) => void }) {
  const now = nowInTrip();
  return (
    <ol className="timeline">
      {items.map((it, idx) => {
        const prev = items[idx - 1];
        const prevEnd = prev?.end ?? undefined;
        const gap = prevEnd ? toMin(it.start) - toMin(prevEnd) : 0;
        const past = it.day < now.day || (it.day === now.day && toMin(it.end ?? it.start) < now.minutes);
        return (
          <li key={it.id} className={`${past ? "past" : ""} ${it.category === "transporte" ? "is-transit" : ""}`}>
            {gap >= 20 && <div className="gap">{fmtDuration(gap)} libres</div>}
            <div className="tl-row" style={{ "--cat": CATEGORIES[it.category].color } as React.CSSProperties}>
              <div className="tl-time mono">
                <span>{it.start}</span>
                {it.end && it.category !== "transporte" && <small>{it.end}</small>}
              </div>
              <div className="tl-node" />
              <div className="tl-body">
                <ItemCard item={it} onClick={() => onOpen(it)} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Places({ items, onOpen }: { items: Item[]; onOpen: (i: Item) => void }) {
  const places = items.filter((i) => i.category !== "transporte");
  const ideas = places.filter((i) => !i.day);
  return (
    <div className="places">
      {CATEGORY_ORDER.filter((c) => c !== "transporte").map((c) => {
        const list = places.filter((i) => i.category === c && i.day);
        if (!list.length) return null;
        return (
          <section key={c} style={{ "--cat": CATEGORIES[c].color } as React.CSSProperties}>
            <h2 className="section-title cat-title">
              <CategoryIcon c={c} /> {CATEGORIES[c].label} <span className="count">{list.length}</span>
            </h2>
            <ul className="place-list">
              {list.map((i) => (
                <PlaceRow key={i.id} item={i} onOpen={onOpen} />
              ))}
            </ul>
          </section>
        );
      })}
      <section>
        <h2 className="section-title">
          Ideas sin día <span className="count">{ideas.length}</span>
        </h2>
        {ideas.length ? (
          <ul className="place-list">
            {ideas.map((i) => (
              <PlaceRow key={i.id} item={i} onOpen={onOpen} />
            ))}
          </ul>
        ) : (
          <p className="muted small">Lugares que querés conocer si sobra tiempo. Agregalos con el + y elegí &ldquo;Sin día&rdquo;.</p>
        )}
      </section>
    </div>
  );
}

function PlaceRow({ item, onOpen }: { item: Item; onOpen: (i: Item) => void }) {
  const url = placeUrl(item);
  return (
    <li style={{ "--cat": CATEGORIES[item.category].color } as React.CSSProperties}>
      <button className="grow" onClick={() => onOpen(item)}>
        <strong>{item.title}</strong>
        <small>
          {item.day ? `${dayLabel(item.day).weekday} ${item.start}` : CATEGORIES[item.category].label}
          {item.place && item.place.name !== item.title ? ` · ${item.place.name}` : ""}
        </small>
      </button>
      {url && (
        <a className="pill" href={url} target="_blank" rel="noreferrer">
          Maps
        </a>
      )}
    </li>
  );
}

function addMinutes(hhmm: string, min: number) {
  const t = Math.min(toMin(hhmm) + min, 23 * 60 + 59);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
