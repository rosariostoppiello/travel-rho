"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { BagIcon, sortBags } from "@/components/bags";
import { IconCheck, IconDots, IconPlus } from "@/components/Icons";
import { Sheet } from "@/components/Sheet";
import { useTrip } from "@/components/TripProvider";
import { DEFAULT_TEMPLATES } from "@/lib/defaults";
import { docId } from "@/lib/id";
import type { Bag, PackItem, Template } from "@/lib/types";

const SHARED = "__compartido";
const ALL = "__todo";
const NONE = "__sinbolso";
const SUGGESTIONS = ["Valija", "Carry-on", "Mochila", "Bolso concierto", "Riñonera", "Cartera", "Neceser"];

export default function BagsPage() {
  return (
    <Suspense>
      <Bags />
    </Suspense>
  );
}

function Bags() {
  const { bundle, me, save, remove } = useTrip();
  const { trip, packing, bags } = bundle!;
  const params = useSearchParams();
  const [who, setWho] = useState<string>(ALL);
  const [sel, setSel] = useState<string>(params.get("bolso") ?? ALL);
  const [hidePacked, setHidePacked] = useState(false);
  const [editing, setEditing] = useState<PackItem | null>(null);
  const [bagSheet, setBagSheet] = useState<Bag | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const bagById = useMemo(() => new Map(bags.map((b) => [b.id, b])), [bags]);
  const ownerOk = (owner?: string) => who === ALL || (who === SHARED ? !owner : !owner || owner === who);
  const visibleBags = sortBags(bags).filter((b) => ownerOk(b.who));
  const loose = packing
    .filter((p) => !p.bag || !bagById.has(p.bag))
    .filter((p) => ownerOk(p.who))
    .sort((a, b) => a.order - b.order);

  // Si el bolso elegido deja de existir o queda fuera del filtro, volvemos a "Todo".
  useEffect(() => {
    if (sel !== ALL && sel !== NONE && !visibleBags.some((b) => b.id === sel)) setSel(ALL);
  }, [sel, visibleBags]);

  const selBag = bagById.get(sel);
  const inSel = (p: PackItem) => (sel === NONE ? !p.bag || !bagById.has(p.bag) : p.bag === sel);
  const shown =
    sel === ALL
      ? [...visibleBags.flatMap((b) => packing.filter((p) => p.bag === b.id)), ...loose]
      : sel === NONE
        ? loose
        : packing.filter(inSel);
  const done = shown.filter((p) => p.packed).length;
  const nextOrder = () => Math.max(0, ...packing.map((p) => p.order)) + 1;
  const ownerForNew = (bag?: Bag) => bag?.who ?? (who === ALL || who === SHARED ? undefined : who);

  const add = (text: string) =>
    save("packing", {
      id: docId(),
      bag: selBag?.id,
      list: "",
      text,
      packed: false,
      who: ownerForNew(selBag),
      order: nextOrder(),
    });

  return (
    <main>
      <header className="page-head">
        <p className="eyebrow">{trip.name}</p>
        <div className="row between">
          <h1 className="display">Bolsos</h1>
          <button className="btn small" onClick={() => setTemplatesOpen(true)}>
            Plantillas
          </button>
        </div>
      </header>

      <div className="chips scroll">
        <button className={`chip ${who === ALL ? "on" : ""}`} onClick={() => setWho(ALL)}>
          Todos
        </button>
        {trip.members.map((m) => (
          <button key={m} className={`chip ${who === m ? "on" : ""}`} onClick={() => setWho(m)}>
            {m === me ? `${m} (yo)` : m}
          </button>
        ))}
        <button className={`chip ${who === SHARED ? "on" : ""}`} onClick={() => setWho(SHARED)}>
          Compartidos
        </button>
      </div>

      <div className="bag-strip">
        <BagCard
          label="Todo"
          sub={`${visibleBags.length} ${visibleBags.length === 1 ? "bolso" : "bolsos"}`}
          items={[...visibleBags.flatMap((b) => packing.filter((p) => p.bag === b.id)), ...loose]}
          on={sel === ALL}
          onClick={() => setSel(ALL)}
        />
        {visibleBags.map((b) => (
          <BagCard
            key={b.id}
            label={b.name}
            sub={b.who ?? "compartido"}
            icon={<BagIcon name={b.name} />}
            items={packing.filter((p) => p.bag === b.id)}
            on={sel === b.id}
            onClick={() => setSel(b.id)}
          />
        ))}
        {loose.length > 0 && (
          <BagCard label="Sin bolso" sub="para ubicar" items={loose} on={sel === NONE} onClick={() => setSel(NONE)} />
        )}
        <button
          className="bag-card add"
          onClick={() =>
            setBagSheet({ id: docId(), name: "", who: ownerForNew(), order: Math.max(0, ...bags.map((b) => b.order)) + 1 })
          }
        >
          <IconPlus size={20} />
          <span>Nuevo bolso</span>
        </button>
      </div>

      <div className="pack-summary">
        <div className="ring" style={{ "--p": shown.length ? done / shown.length : 0 } as React.CSSProperties}>
          <span className="mono">{shown.length ? Math.round((done / shown.length) * 100) : 0}%</span>
        </div>
        <div className="grow">
          <strong>
            {selBag ? selBag.name : sel === NONE ? "Sin bolso" : "Todo"} · {done} de {shown.length}
          </strong>
          <label className="toggle">
            <input type="checkbox" checked={hidePacked} onChange={(e) => setHidePacked(e.target.checked)} />
            Ocultar lo que ya está
          </label>
        </div>
        {selBag && (
          <button className="icon-btn boxed" onClick={() => setBagSheet(selBag)} aria-label="Editar bolso">
            <IconDots />
          </button>
        )}
      </div>

      {bags.length === 0 && loose.length === 0 && (
        <div className="empty">
          <p>Creá tus bolsos (valija, mochila, el bolso del concierto) y cargá lo que va en cada uno.</p>
          <button
            className="btn primary"
            onClick={() => setBagSheet({ id: docId(), name: "", who: me ?? undefined, order: 1 })}
          >
            Crear el primero
          </button>
        </div>
      )}

      {sel === ALL ? (
        <>
          {visibleBags.map((b) => {
            const rows = packing.filter((p) => p.bag === b.id).sort((x, y) => x.order - y.order);
            return (
              <section key={b.id} className="pack-group">
                <button className="section-title bag-title" onClick={() => setSel(b.id)}>
                  <BagIcon name={b.name} /> {b.name}
                  <span className="count">
                    {rows.filter((p) => p.packed).length}/{rows.length}
                  </span>
                </button>
                <ItemRows rows={rows} hidePacked={hidePacked} onEdit={setEditing} empty="Vacío. Tocá el bolso para cargarlo." />
              </section>
            );
          })}
          {loose.length > 0 && (
            <section className="pack-group">
              <button className="section-title bag-title" onClick={() => setSel(NONE)}>
                Sin bolso <span className="count">{loose.length}</span>
              </button>
              <ItemRows rows={loose} hidePacked={hidePacked} onEdit={setEditing} />
            </section>
          )}
        </>
      ) : (
        <section className="pack-group">
          <ItemRows rows={shown.sort((a, b) => a.order - b.order)} hidePacked={hidePacked} onEdit={setEditing} />
          {sel !== NONE && <AddRow onAdd={add} />}
        </section>
      )}

      {editing && (
        <EditPack
          item={editing}
          bags={sortBags(bags)}
          members={trip.members}
          onClose={() => setEditing(null)}
          onSave={(p) => save("packing", p)}
          onDelete={() => remove("packing", editing.id)}
        />
      )}
      {bagSheet && (
        <BagSheet
          bag={bagSheet}
          exists={bagById.has(bagSheet.id)}
          members={trip.members}
          count={packing.filter((p) => p.bag === bagSheet.id).length}
          onClose={() => setBagSheet(null)}
          onSave={(b) => {
            save("bags", b);
            // Si cambia el dueño del bolso, sus cosas pasan a ser de esa persona.
            const moved = packing.filter((p) => p.bag === b.id && p.who !== b.who).map((p) => ({ ...p, who: b.who }));
            if (moved.length) save("packing", moved);
            setSel(b.id);
          }}
          onDelete={() => {
            const orphans = packing.filter((p) => p.bag === bagSheet.id).map((p) => ({ ...p, bag: undefined }));
            if (orphans.length) save("packing", orphans);
            remove("bags", bagSheet.id);
            setSel(ALL);
          }}
        />
      )}
      <Templates
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        target={selBag}
        current={shown}
        tripName={selBag?.name ?? trip.name}
        onLoad={(t) => {
          const have = new Set(packing.filter((p) => p.bag === selBag?.id).map((p) => p.text.toLowerCase()));
          let order = nextOrder();
          const docs = t.items
            .filter((i) => !have.has(i.text.toLowerCase()))
            .map((i) => ({
              id: docId(),
              bag: selBag?.id,
              list: "",
              text: i.text,
              qty: i.qty,
              packed: false,
              who: ownerForNew(selBag),
              order: order++,
            }));
          if (docs.length) save("packing", docs);
          if (!selBag) setSel(NONE);
          setTemplatesOpen(false);
        }}
      />
    </main>
  );
}

function BagCard({
  label,
  sub,
  icon,
  items,
  on,
  onClick,
}: {
  label: string;
  sub: string;
  icon?: React.ReactNode;
  items: PackItem[];
  on: boolean;
  onClick: () => void;
}) {
  const done = items.filter((p) => p.packed).length;
  return (
    <button className={`bag-card ${on ? "on" : ""}`} onClick={onClick}>
      <div className="row between">
        <span className="bag-icon">{icon}</span>
        <span className="mono small">
          {done}/{items.length}
        </span>
      </div>
      <strong>{label}</strong>
      <small>{sub}</small>
      <div className="bar">
        <i style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
      </div>
    </button>
  );
}

function ItemRows({
  rows,
  hidePacked,
  onEdit,
  empty,
}: {
  rows: PackItem[];
  hidePacked: boolean;
  onEdit: (p: PackItem) => void;
  empty?: string;
}) {
  const { save } = useTrip();
  const visible = hidePacked ? rows.filter((p) => !p.packed) : rows;
  if (!rows.length && empty) return <p className="muted small pack-empty">{empty}</p>;
  return (
    <ul className="pack-list">
      {visible.map((p) => (
        <li key={p.id} className={p.packed ? "on" : ""}>
          <button className="check grow" onClick={() => save("packing", { ...p, packed: !p.packed })}>
            <span className="box">{p.packed && <IconCheck size={14} />}</span>
            <span className="grow">
              {p.text}
              {p.qty && p.qty > 1 && <span className="qty mono"> ×{p.qty}</span>}
            </span>
          </button>
          <button className="icon-btn" onClick={() => onEdit(p)} aria-label="Editar">
            <IconDots />
          </button>
        </li>
      ))}
    </ul>
  );
}

function AddRow({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      className="add-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onAdd(text.trim());
        setText("");
      }}
    >
      <IconPlus size={16} />
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Agregar…" enterKeyHint="done" />
    </form>
  );
}

function BagSheet({
  bag,
  exists,
  members,
  count,
  onClose,
  onSave,
  onDelete,
}: {
  bag: Bag;
  exists: boolean;
  members: string[];
  count: number;
  onClose: () => void;
  onSave: (b: Bag) => void;
  onDelete: () => void;
}) {
  const [d, setD] = useState(bag);
  const submit = () => {
    if (!d.name.trim()) return;
    onSave({ ...d, name: d.name.trim() });
    onClose();
  };
  return (
    <Sheet
      open
      onClose={onClose}
      title={exists ? "Editar bolso" : "Nuevo bolso"}
      footer={
        <>
          {exists && (
            <button
              className="btn ghost danger"
              onClick={() => {
                const msg = count ? `¿Borrar “${bag.name}”? Sus ${count} cosas quedan en “Sin bolso”.` : `¿Borrar “${bag.name}”?`;
                if (confirm(msg)) {
                  onDelete();
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
        <span>Nombre</span>
        <input
          autoFocus={!exists}
          value={d.name}
          onChange={(e) => setD({ ...d, name: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Valija Ro, Mochila, Bolso concierto…"
        />
      </label>
      {!exists && (
        <div className="chips wrap field">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              onClick={() => setD({ ...d, name: d.who && !/concierto/i.test(s) ? `${s} ${d.who}` : s })}
            >
              <BagIcon name={s} size={14} /> {s}
            </button>
          ))}
        </div>
      )}
      <div className="field">
        <span>De quién</span>
        <div className="chips wrap">
          {members.map((m) => (
            <button key={m} type="button" className={`chip ${d.who === m ? "on" : ""}`} onClick={() => setD({ ...d, who: m })}>
              {m}
            </button>
          ))}
          <button type="button" className={`chip ${!d.who ? "on" : ""}`} onClick={() => setD({ ...d, who: undefined })}>
            Compartido
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function EditPack({
  item,
  bags,
  members,
  onClose,
  onSave,
  onDelete,
}: {
  item: PackItem;
  bags: Bag[];
  members: string[];
  onClose: () => void;
  onSave: (p: PackItem) => void;
  onDelete: () => void;
}) {
  const [d, setD] = useState(item);
  const inBag = bags.find((b) => b.id === d.bag);
  return (
    <Sheet
      open
      onClose={onClose}
      title="Editar"
      footer={
        <>
          <button className="btn ghost danger" onClick={() => (onDelete(), onClose())}>
            Borrar
          </button>
          <button className="btn primary grow" onClick={() => (onSave(d), onClose())}>
            Guardar
          </button>
        </>
      }
    >
      <div className="grid-qty">
        <label className="field">
          <span>Qué</span>
          <input value={d.text} onChange={(e) => setD({ ...d, text: e.target.value })} />
        </label>
        <label className="field">
          <span>Cant.</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={d.qty ?? ""}
            onChange={(e) => setD({ ...d, qty: e.target.value ? Number(e.target.value) : undefined })}
          />
        </label>
      </div>
      <div className="field">
        <span>En qué bolso</span>
        <div className="chips wrap">
          {bags.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`chip ${d.bag === b.id ? "on" : ""}`}
              onClick={() => setD({ ...d, bag: b.id, who: b.who })}
            >
              <BagIcon name={b.name} size={14} /> {b.name}
            </button>
          ))}
          <button type="button" className={`chip ${!inBag ? "on" : ""}`} onClick={() => setD({ ...d, bag: undefined })}>
            Sin bolso
          </button>
        </div>
      </div>
      {!inBag && (
        <div className="field">
          <span>De quién</span>
          <div className="chips wrap">
            {members.map((m) => (
              <button key={m} type="button" className={`chip ${d.who === m ? "on" : ""}`} onClick={() => setD({ ...d, who: m })}>
                {m}
              </button>
            ))}
            <button type="button" className={`chip ${!d.who ? "on" : ""}`} onClick={() => setD({ ...d, who: undefined })}>
              Compartido
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function Templates({
  open,
  onClose,
  target,
  current,
  tripName,
  onLoad,
}: {
  open: boolean;
  onClose: () => void;
  target?: Bag;
  current: PackItem[];
  tripName: string;
  onLoad: (t: Template) => void;
}) {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [name, setName] = useState(tripName);
  const [saved, setSaved] = useState<string | null>(null);

  const load = () =>
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => setTemplates([]));

  useEffect(() => {
    if (open) {
      load();
      setSaved(null);
      setName(tripName);
    }
  }, [open, tripName]);

  const factory = new Set(DEFAULT_TEMPLATES.map((t) => t.id));

  const saveCurrent = async () => {
    const n = name.trim();
    if (!n || !current.length) return;
    const existing = templates?.find((t) => t.name.toLowerCase() === n.toLowerCase());
    const t: Template = {
      id: existing?.id ?? docId(),
      name: n,
      items: current.map((p) => ({ list: "", text: p.text, qty: p.qty })),
      updatedAt: Date.now(),
    };
    await fetch("/api/templates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) });
    setSaved(existing ? `Actualizada “${n}”` : `Guardada “${n}”`);
    load();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Plantillas">
      <p className="muted small">
        Listas base para cualquier viaje. Se cargan {target ? <b>en {target.name}</b> : "en “Sin bolso” (elegí un bolso antes para cargarla adentro)"} y
        no duplican lo que ya está.
      </p>
      {templates === null ? (
        <div className="loader small" />
      ) : (
        <ul className="template-list">
          {templates.map((t) => (
            <li key={t.id}>
              <div className="grow">
                <strong>{t.name}</strong>
                <small>{t.items.length} cosas</small>
              </div>
              {!factory.has(t.id) && (
                <button
                  className="btn ghost small danger"
                  onClick={async () => {
                    if (!confirm(`¿Borrar la plantilla “${t.name}”?`)) return;
                    await fetch(`/api/templates?id=${t.id}`, { method: "DELETE" });
                    load();
                  }}
                >
                  Borrar
                </button>
              )}
              <button className="btn small" onClick={() => onLoad(t)}>
                Cargar
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="divider" />
      <div className="field">
        <span>Guardar {target ? `“${target.name}”` : "lo que estás viendo"} como plantilla</span>
        <div className="row">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
          <button className="btn primary" onClick={saveCurrent} disabled={!current.length}>
            Guardar
          </button>
        </div>
        <p className="hint">
          {saved ?? `Guarda las ${current.length} cosas (sin los tildes) para el próximo viaje. Si el nombre ya existe, la reemplaza.`}
        </p>
      </div>
    </Sheet>
  );
}
