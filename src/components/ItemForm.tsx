"use client";

import { useState } from "react";
import { CATEGORIES, CATEGORY_ORDER, TRANSPORT } from "@/lib/categories";
import { docId } from "@/lib/id";
import { dayLabel, daysBetween } from "@/lib/time";
import type { Item, TransportMode } from "@/lib/types";
import { AttachmentEditor, dropRemoved } from "./Attachments";
import { BagIcon, sortBags } from "./bags";
import { CategoryIcon, IconClose, IconPlus } from "./Icons";
import { PlacePicker } from "./PlacePicker";
import { Sheet } from "./Sheet";
import { useTrip } from "./TripProvider";

export function blankItem(day: string, start = "10:00"): Item {
  return { id: docId(), day, start, title: "", category: "paseo", links: [] };
}

export function ItemForm({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const { bundle, save, remove, me } = useTrip();
  const [draft, setDraft] = useState<Item | null>(item);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  if (!bundle || !draft) return null;
  const { trip } = bundle;
  const exists = bundle.items.some((i) => i.id === draft.id);
  const set = (patch: Partial<Item>) => setDraft({ ...draft, ...patch });
  const days = daysBetween(trip.startDate, trip.endDate);

  const addLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    const full = /^https?:\/\//.test(url) ? url : `https://${url}`;
    let label = linkLabel.trim();
    if (!label) {
      try {
        label = new URL(full).hostname.replace(/^www\./, "");
      } catch {
        label = "Link";
      }
    }
    set({ links: [...draft.links, { label, url: full }] });
    setLinkUrl("");
    setLinkLabel("");
  };

  const submit = () => {
    if (!draft.title.trim() && !draft.place?.name) return;
    // Si quedó un link escrito sin agregar, lo sumamos igual.
    const pendingLink = linkUrl.trim()
      ? [{ label: linkLabel.trim() || "Link", url: /^https?:\/\//.test(linkUrl) ? linkUrl.trim() : `https://${linkUrl.trim()}` }]
      : [];
    dropRemoved(trip.id, item?.files, draft.files);
    save("items", {
      ...draft,
      title: draft.title.trim() || draft.place!.name,
      links: [...draft.links, ...pendingLink],
      updatedBy: me ?? undefined,
      updatedAt: Date.now(),
    });
    onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={exists ? "Editar" : "Nueva actividad"}
      footer={
        <>
          {exists && (
            <button
              className="btn ghost danger"
              onClick={() => {
                if (confirm("¿Borrar esta actividad?")) {
                  remove("items", draft.id);
                  dropRemoved(trip.id, item?.files, []);
                  onClose();
                }
              }}
            >
              Borrar
            </button>
          )}
          <button className="btn primary grow" onClick={submit}>
            Guardar
          </button>
        </>
      }
    >
      <label className="field">
        <span>Qué</span>
        <input
          autoFocus={!exists}
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder={draft.category === "transporte" ? "Ej: Subte al centro" : "Ej: Almuerzo en Don Julio"}
        />
      </label>

      <div className="field">
        <span>Tipo</span>
        <div className="chips wrap">
          {CATEGORY_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip cat ${draft.category === c ? "on" : ""}`}
              style={{ "--cat": CATEGORIES[c].color } as React.CSSProperties}
              onClick={() => set({ category: c, transport: c === "transporte" ? draft.transport ?? { mode: "subte" } : undefined })}
            >
              <CategoryIcon c={c} size={15} />
              {CATEGORIES[c].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid3">
        <label className="field">
          <span>Día</span>
          <select value={draft.day} onChange={(e) => set({ day: e.target.value })}>
            {days.map((d) => (
              <option key={d} value={d}>
                {dayLabel(d).weekday} {dayLabel(d).short}
              </option>
            ))}
            <option value="">Sin día (idea)</option>
          </select>
        </label>
        <label className="field">
          <span>Desde</span>
          <input type="time" value={draft.start} onChange={(e) => set({ start: e.target.value })} />
        </label>
        <label className="field">
          <span>Hasta</span>
          <input type="time" value={draft.end ?? ""} onChange={(e) => set({ end: e.target.value || undefined })} />
        </label>
      </div>

      {draft.category === "transporte" && draft.transport && (
        <div className="field">
          <span>Cómo</span>
          <div className="chips wrap">
            {(Object.keys(TRANSPORT) as TransportMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`chip ${draft.transport?.mode === m ? "on" : ""}`}
                onClick={() => set({ transport: { ...draft.transport!, mode: m } })}
              >
                {TRANSPORT[m]}
              </button>
            ))}
          </div>
          <div className="grid2 mt">
            <input
              placeholder="Desde"
              value={draft.transport.from ?? ""}
              onChange={(e) => set({ transport: { ...draft.transport!, from: e.target.value } })}
            />
            <input
              placeholder="Hasta"
              value={draft.transport.to ?? ""}
              onChange={(e) => set({ transport: { ...draft.transport!, to: e.target.value } })}
            />
          </div>
        </div>
      )}

      <div className="field">
        <span>{draft.category === "transporte" ? "Destino en el mapa" : "Dónde"}</span>
        <PlacePicker value={draft.place} onChange={(place) => set({ place })} near={trip} />
      </div>

      <div className="field">
        <span>Links</span>
        {draft.links.length > 0 && (
          <ul className="link-list">
            {draft.links.map((l, i) => (
              <li key={i}>
                <a href={l.url} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Quitar link"
                  onClick={() => set({ links: draft.links.filter((_, j) => j !== i) })}
                >
                  <IconClose size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="row">
          <input placeholder="Nombre (opcional)" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className="w40" />
          <input
            placeholder="https://…"
            inputMode="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
          />
          <button type="button" className="icon-btn boxed" onClick={addLink} aria-label="Agregar link">
            <IconPlus size={18} />
          </button>
        </div>
      </div>

      {bundle.bags.length > 0 && (
        <div className="field">
          <span>Llevar</span>
          <div className="chips wrap">
            {sortBags(bundle.bags).map((b) => {
              const on = draft.bags?.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  className={`chip ${on ? "on" : ""}`}
                  onClick={() => set({ bags: on ? draft.bags!.filter((x) => x !== b.id) : [...(draft.bags ?? []), b.id] })}
                >
                  <BagIcon name={b.name} size={14} /> {b.name}
                </button>
              );
            })}
          </div>
          <p className="hint">Cuando se acerque la actividad, en Ahora aparece la lista para tildar antes de salir.</p>
        </div>
      )}

      <div className="field">
        <span>Archivos</span>
        <AttachmentEditor files={draft.files ?? []} onChange={(files) => set({ files })} />
        <p className="hint">QR de la reserva, entradas, voucher del hotel. Sólo los ve quien entra al viaje.</p>
      </div>

      <div className="grid2">
        <label className="field">
          <span>Precio aprox.</span>
          <input value={draft.cost ?? ""} onChange={(e) => set({ cost: e.target.value })} placeholder="Ej: $25.000 c/u" />
        </label>
        <div />
      </div>

      <label className="field">
        <span>Notas</span>
        <textarea
          rows={3}
          value={draft.notes ?? ""}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Reserva a nombre de…, pedir la provoleta, etc."
        />
      </label>
    </Sheet>
  );
}
