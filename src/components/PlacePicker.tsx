"use client";

import { useState } from "react";
import type { Place } from "@/lib/types";
import { IconClose, IconPin } from "./Icons";

/** Acepta un link de Google Maps pegado o un nombre para buscar. */
export function PlacePicker({
  value,
  onChange,
  near,
}: {
  value?: Place;
  onChange: (p: Place | undefined) => void;
  near?: { lat?: number; lng?: number };
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const go = async () => {
    const text = q.trim();
    if (!text) return;
    setBusy(true);
    setErr(null);
    setResults(null);
    try {
      const isUrl = /^https?:\/\//.test(text);
      const params = new URLSearchParams(isUrl ? { url: text } : { q: text });
      if (!isUrl && near?.lat) params.set("near", `${near.lat},${near.lng}`);
      const res = await fetch(`/api/place?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (isUrl) {
        onChange(data);
        setQ("");
      } else if (!data.length) {
        setErr("Nada por ese nombre. Probá pegando el link de Google Maps.");
      } else setResults(data);
    } catch (e) {
      setErr((e as Error).message || "No se pudo buscar");
    } finally {
      setBusy(false);
    }
  };

  if (value) {
    return (
      <div className="place-chosen">
        <IconPin />
        <div className="grow">
          <input
            className="bare"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            aria-label="Nombre del lugar"
          />
          <small>
            {value.lat !== undefined ? value.address || `${value.lat.toFixed(4)}, ${value.lng?.toFixed(4)}` : "Sin pin en el mapa"}
          </small>
        </div>
        <button type="button" className="icon-btn" onClick={() => onChange(undefined)} aria-label="Quitar lugar">
          <IconClose size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="place-picker">
      <div className="row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), go())}
          placeholder="Pegá un link de Maps o buscá por nombre"
        />
        <button type="button" className="btn small" onClick={go} disabled={busy}>
          {busy ? "…" : "Buscar"}
        </button>
      </div>
      {err && <p className="hint err">{err}</p>}
      {results && (
        <ul className="results">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => (onChange(r), setResults(null), setQ(""))}>
                <strong>{r.name}</strong>
                <small>{r.address}</small>
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => (onChange({ name: q.trim() }), setResults(null), setQ(""))}>
              <strong>Usar &ldquo;{q.trim()}&rdquo; sin pin</strong>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
