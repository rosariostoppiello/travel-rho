"use client";

import { CATEGORIES, TRANSPORT } from "@/lib/categories";
import { fmtDuration, toMin } from "@/lib/time";
import type { Item } from "@/lib/types";
import { CategoryIcon, IconDirections, IconLink, IconPin } from "./Icons";

export const directionsUrl = (item: Item) => {
  const p = item.place;
  if (!p) return null;
  const dest = p.lat !== undefined ? `${p.lat},${p.lng}` : p.name;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
};

export const placeUrl = (item: Item) => {
  const p = item.place;
  if (!p) return null;
  if (p.mapsUrl) return p.mapsUrl;
  const q = p.lat !== undefined ? `${p.lat},${p.lng}` : p.name;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};

export function ItemActions({ item }: { item: Item }) {
  const dir = directionsUrl(item);
  const place = placeUrl(item);
  if (!dir && !item.links.length) return null;
  return (
    <div className="actions" onClick={(e) => e.stopPropagation()}>
      {dir && (
        <a className="pill" href={dir} target="_blank" rel="noreferrer">
          <IconDirections size={15} /> Cómo llegar
        </a>
      )}
      {place && (
        <a className="pill" href={place} target="_blank" rel="noreferrer">
          <IconPin size={15} /> Ver en Maps
        </a>
      )}
      {item.links.map((l, i) => (
        <a key={i} className="pill" href={l.url} target="_blank" rel="noreferrer">
          <IconLink size={14} /> {l.label}
        </a>
      ))}
    </div>
  );
}

export function ItemCard({ item, onClick, compact }: { item: Item; onClick?: () => void; compact?: boolean }) {
  const cat = CATEGORIES[item.category];
  const style = { "--cat": cat.color } as React.CSSProperties;
  const duration = item.end ? toMin(item.end) - toMin(item.start) : NaN;

  if (item.category === "evento") {
    return (
      <article className="card ticket" style={style} onClick={onClick}>
        <div className="ticket-main">
          <span className="eyebrow">
            <CategoryIcon c="evento" size={14} /> {cat.label}
          </span>
          <h3>{item.title}</h3>
          {item.place && <p className="muted">{item.place.name}</p>}
          {item.notes && !compact && <p className="notes">{item.notes}</p>}
          {!compact && <ItemActions item={item} />}
        </div>
        <div className="ticket-stub">
          <span className="mono big">{item.start}</span>
          {item.end && <span className="mono">{item.end}</span>}
        </div>
      </article>
    );
  }

  if (item.category === "transporte") {
    return (
      <article className="card transit" style={style} onClick={onClick}>
        <CategoryIcon c="transporte" size={16} />
        <div className="grow">
          <strong>{item.title}</strong>
          <small>
            {[item.transport && TRANSPORT[item.transport.mode], !isNaN(duration) && fmtDuration(duration), item.transport?.from && `desde ${item.transport.from}`, item.transport?.to && `a ${item.transport.to}`]
              .filter(Boolean)
              .join(" · ")}
          </small>
        </div>
        {!compact && directionsUrl(item) && (
          <a className="pill" href={directionsUrl(item)!} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
            <IconDirections size={15} />
          </a>
        )}
      </article>
    );
  }

  return (
    <article className="card item" style={style} onClick={onClick}>
      <span className="eyebrow">
        <CategoryIcon c={item.category} size={14} /> {cat.label}
        {!isNaN(duration) && duration > 0 && <span className="dim"> · {fmtDuration(duration)}</span>}
      </span>
      <h3>{item.title}</h3>
      {item.place && item.place.name !== item.title && <p className="muted">{item.place.name}</p>}
      {!compact && (item.notes || item.cost) && (
        <p className="notes">
          {item.cost && <span className="cost">{item.cost}</span>}
          {item.notes}
        </p>
      )}
      {!compact && <ItemActions item={item} />}
    </article>
  );
}
