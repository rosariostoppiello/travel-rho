"use client";

import Link from "next/link";
import type { Bag, Item, PackItem } from "@/lib/types";
import { IconBackpack, IconCheck, IconSuitcase, IconTote } from "./Icons";
import { useTrip } from "./TripProvider";

export function BagIcon({ name, size = 20 }: { name: string; size?: number }) {
  if (/mochila|backpack/i.test(name)) return <IconBackpack size={size} />;
  if (/valija|carry|maleta|suitcase/i.test(name)) return <IconSuitcase size={size} />;
  return <IconTote size={size} />;
}

export const itemsOf = (bag: Bag, packing: PackItem[]) =>
  packing.filter((p) => p.bag === bag.id).sort((a, b) => a.order - b.order);

export const sortBags = (bags: Bag[]) => [...bags].sort((a, b) => a.order - b.order);

/** Checklist de un bolso para tildar sin salir de donde estás (Ahora, tarjeta de actividad). */
export function BagChecklist({ bag, forItem }: { bag: Bag; forItem?: Item }) {
  const { bundle, save } = useTrip();
  const items = itemsOf(bag, bundle!.packing);
  const done = items.filter((p) => p.packed).length;
  return (
    <div className="card checklist">
      <div className="row between">
        <span className="eyebrow">
          <BagIcon name={bag.name} size={14} /> {bag.name}
        </span>
        <span className="mono small muted">
          {done}/{items.length}
        </span>
      </div>
      {forItem && (
        <p className="small muted">
          Para {forItem.title} · {forItem.start}
        </p>
      )}
      {items.length === 0 ? (
        <Link className="muted small" href={`/t/${bundle!.trip.id}/valija?bolso=${bag.id}`}>
          Está vacío. Cargalo en Bolsos →
        </Link>
      ) : (
        <ul>
          {items.map((p) => (
            <li key={p.id}>
              <button className={`check ${p.packed ? "on" : ""}`} onClick={() => save("packing", { ...p, packed: !p.packed })}>
                <span className="box">{p.packed && <IconCheck size={14} />}</span>
                {p.text}
                {p.qty && p.qty > 1 && <span className="qty mono"> ×{p.qty}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Línea compacta en la tarjeta de una actividad: "Llevar: Bolso concierto 3/8". */
export function BagLine({ bagIds }: { bagIds: string[] }) {
  const { bundle } = useTrip();
  const bags = bundle!.bags.filter((b) => bagIds.includes(b.id));
  if (!bags.length) return null;
  return (
    <div className="bag-line" onClick={(e) => e.stopPropagation()}>
      {bags.map((b) => {
        const items = itemsOf(b, bundle!.packing);
        const done = items.filter((p) => p.packed).length;
        const ready = items.length > 0 && done === items.length;
        return (
          <Link key={b.id} className={`pill ${ready ? "ready" : ""}`} href={`/t/${bundle!.trip.id}/valija?bolso=${b.id}`}>
            <BagIcon name={b.name} size={14} /> {b.name}
            <span className="mono">{ready ? "listo" : `${done}/${items.length}`}</span>
          </Link>
        );
      })}
    </div>
  );
}
