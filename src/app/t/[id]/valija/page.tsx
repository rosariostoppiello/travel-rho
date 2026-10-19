"use client";

import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconDots, IconPlus } from "@/components/Icons";
import { Sheet } from "@/components/Sheet";
import { useTrip } from "@/components/TripProvider";
import { DEFAULT_TEMPLATES } from "@/lib/defaults";
import { docId } from "@/lib/id";
import type { PackItem, Template } from "@/lib/types";

const SHARED = "__compartido";

export default function PackingPage() {
  const { bundle, me, save, remove } = useTrip();
  const { trip, packing } = bundle!;
  const [who, setWho] = useState<string>(me!);
  const [hidePacked, setHidePacked] = useState(false);
  const [editing, setEditing] = useState<PackItem | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [newList, setNewList] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      packing
        .filter((p) => (who === "todos" ? true : who === SHARED ? !p.who : p.who === who || !p.who))
        .sort((a, b) => a.order - b.order),
    [packing, who],
  );
  const lists = useMemo(() => {
    const names = [...new Set(visible.map((p) => p.list))];
    if (newList && !names.includes(newList)) names.push(newList);
    return names;
  }, [visible, newList]);

  const done = visible.filter((p) => p.packed).length;
  const owner = who === "todos" || who === SHARED ? undefined : who;
  const nextOrder = () => Math.max(0, ...packing.map((p) => p.order)) + 1;

  const add = (list: string, text: string) => {
    save("packing", { id: docId(), list, text, packed: false, who: owner, order: nextOrder() });
  };

  return (
    <main>
      <header className="page-head">
        <p className="eyebrow">{trip.name}</p>
        <div className="row between">
          <h1 className="display">Valija</h1>
          <button className="btn small" onClick={() => setTemplatesOpen(true)}>
            Plantillas
          </button>
        </div>
      </header>

      <div className="chips scroll">
        {trip.members.map((m) => (
          <button key={m} className={`chip ${who === m ? "on" : ""}`} onClick={() => setWho(m)}>
            {m === me ? `${m} (yo)` : m}
          </button>
        ))}
        <button className={`chip ${who === SHARED ? "on" : ""}`} onClick={() => setWho(SHARED)}>
          Compartido
        </button>
        <button className={`chip ${who === "todos" ? "on" : ""}`} onClick={() => setWho("todos")}>
          Todo
        </button>
      </div>

      <div className="pack-summary">
        <div className="ring" style={{ "--p": visible.length ? done / visible.length : 0 } as React.CSSProperties}>
          <span className="mono">{visible.length ? Math.round((done / visible.length) * 100) : 0}%</span>
        </div>
        <div className="grow">
          <strong>
            {done} de {visible.length} adentro
          </strong>
          <label className="toggle">
            <input type="checkbox" checked={hidePacked} onChange={(e) => setHidePacked(e.target.checked)} />
            Ocultar lo que ya está
          </label>
        </div>
      </div>

      {lists.length === 0 && (
        <div className="empty">
          <p>Lista vacía. Arrancá desde una plantilla o agregá una sección.</p>
          <button className="btn primary" onClick={() => setTemplatesOpen(true)}>
            Usar una plantilla
          </button>
        </div>
      )}

      {lists.map((list) => {
        const rows = visible.filter((p) => p.list === list);
        const shown = hidePacked ? rows.filter((p) => !p.packed) : rows;
        return (
          <section key={list} className="pack-group">
            <h2 className="section-title">
              {list}
              <span className="count">
                {rows.filter((p) => p.packed).length}/{rows.length}
              </span>
            </h2>
            <ul className="pack-list">
              {shown.map((p) => (
                <li key={p.id} className={p.packed ? "on" : ""}>
                  <button className="check grow" onClick={() => save("packing", { ...p, packed: !p.packed })}>
                    <span className="box">{p.packed && <IconCheck size={14} />}</span>
                    <span className="grow">
                      {p.text}
                      {p.qty && p.qty > 1 && <span className="qty mono"> ×{p.qty}</span>}
                    </span>
                    {who === "todos" && <span className="tag">{p.who ?? "todos"}</span>}
                    {who !== "todos" && !p.who && <span className="tag">compartido</span>}
                  </button>
                  <button className="icon-btn" onClick={() => setEditing(p)} aria-label="Editar">
                    <IconDots />
                  </button>
                </li>
              ))}
            </ul>
            <AddRow onAdd={(t) => add(list, t)} />
          </section>
        );
      })}

      {newList === null ? (
        <button className="btn ghost wide" onClick={() => setNewList("")}>
          <IconPlus size={18} /> Nueva sección
        </button>
      ) : (
        <form
          className="row pad-x"
          onSubmit={(e) => {
            e.preventDefault();
            const name = (new FormData(e.currentTarget).get("n") as string).trim();
            setNewList(name || null);
          }}
        >
          <input name="n" autoFocus placeholder="Ej: Playa, Abrigo, Concierto" />
          <button className="btn primary">Crear</button>
        </form>
      )}

      {editing && (
        <EditPack
          item={editing}
          lists={[...new Set(packing.map((p) => p.list))]}
          members={trip.members}
          onClose={() => setEditing(null)}
          onSave={(p) => save("packing", p)}
          onDelete={() => remove("packing", editing.id)}
        />
      )}
      <Templates
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        current={visible}
        tripName={trip.name}
        onLoad={(t) => {
          const have = new Set(packing.filter((p) => p.who === owner).map((p) => `${p.list}|${p.text}`.toLowerCase()));
          let order = nextOrder();
          const docs = t.items
            .filter((i) => !have.has(`${i.list}|${i.text}`.toLowerCase()))
            .map((i) => ({ id: docId(), list: i.list, text: i.text, qty: i.qty, packed: false, who: owner, order: order++ }));
          if (docs.length) save("packing", docs);
          setTemplatesOpen(false);
        }}
      />
    </main>
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

function EditPack({
  item,
  lists,
  members,
  onClose,
  onSave,
  onDelete,
}: {
  item: PackItem;
  lists: string[];
  members: string[];
  onClose: () => void;
  onSave: (p: PackItem) => void;
  onDelete: () => void;
}) {
  const [d, setD] = useState(item);
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
      <label className="field">
        <span>Qué</span>
        <input value={d.text} onChange={(e) => setD({ ...d, text: e.target.value })} />
      </label>
      <div className="grid2">
        <label className="field">
          <span>Cantidad</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={d.qty ?? ""}
            onChange={(e) => setD({ ...d, qty: e.target.value ? Number(e.target.value) : undefined })}
          />
        </label>
        <label className="field">
          <span>Sección</span>
          <input list="pack-lists" value={d.list} onChange={(e) => setD({ ...d, list: e.target.value })} />
          <datalist id="pack-lists">
            {lists.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </label>
      </div>
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

function Templates({
  open,
  onClose,
  current,
  tripName,
  onLoad,
}: {
  open: boolean;
  onClose: () => void;
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
    }
  }, [open]);

  const factory = new Set(DEFAULT_TEMPLATES.map((t) => t.id));

  const saveCurrent = async () => {
    const n = name.trim();
    if (!n || !current.length) return;
    const existing = templates?.find((t) => t.name.toLowerCase() === n.toLowerCase());
    const t: Template = {
      id: existing?.id ?? docId(),
      name: n,
      items: current.map((p) => ({ list: p.list, text: p.text, qty: p.qty })),
      updatedAt: Date.now(),
    };
    await fetch("/api/templates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) });
    setSaved(existing ? `Actualizada “${n}”` : `Guardada “${n}”`);
    load();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Plantillas">
      <p className="muted small">
        Tus listas base para cualquier viaje. Cargar una suma lo que falte, sin duplicar.
      </p>
      {templates === null ? (
        <div className="loader small" />
      ) : (
        <ul className="template-list">
          {templates.map((t) => (
            <li key={t.id}>
              <div className="grow">
                <strong>{t.name}</strong>
                <small>
                  {t.items.length} cosas · {[...new Set(t.items.map((i) => i.list))].join(", ")}
                </small>
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
        <span>Guardar esta lista como plantilla</span>
        <div className="row">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
          <button className="btn primary" onClick={saveCurrent} disabled={!current.length}>
            Guardar
          </button>
        </div>
        <p className="hint">
          {saved ?? `Guarda las ${current.length} cosas que estás viendo (sin los tildes). Si el nombre ya existe, la reemplaza.`}
        </p>
      </div>
    </Sheet>
  );
}
