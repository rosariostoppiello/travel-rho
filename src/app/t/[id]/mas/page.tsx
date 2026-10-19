"use client";

import Link from "next/link";
import { useState } from "react";
import { IconLink, IconPlus, IconShare } from "@/components/Icons";
import { Sheet } from "@/components/Sheet";
import { useTrip } from "@/components/TripProvider";
import { ars, useDolar } from "@/components/useDolar";
import { docId } from "@/lib/id";
import { nowInTrip } from "@/lib/time";
import type { Expense, Note } from "@/lib/types";

type Tab = "gastos" | "notas" | "viaje";

export default function MorePage() {
  const [tab, setTab] = useState<Tab>("gastos");
  const { bundle } = useTrip();
  return (
    <main>
      <header className="page-head">
        <p className="eyebrow">{bundle!.trip.name}</p>
        <h1 className="display">Más</h1>
        <div className="segmented full">
          {(["gastos", "notas", "viaje"] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
              {{ gastos: "Gastos", notas: "Notas", viaje: "Viaje" }[t]}
            </button>
          ))}
        </div>
      </header>
      {tab === "gastos" && <Expenses />}
      {tab === "notas" && <Notes />}
      {tab === "viaje" && <Settings />}
    </main>
  );
}

/* ---------- Gastos ---------- */

const money = (n: number, cur: Expense["currency"]) =>
  cur === "ARS" ? ars(n) : new Intl.NumberFormat("es-AR", { style: "currency", currency: cur }).format(n);

function settle(expenses: Expense[], cur: Expense["currency"]) {
  const net: Record<string, number> = {};
  for (const e of expenses.filter((x) => x.currency === cur)) {
    const share = e.amount / Math.max(1, e.split.length);
    net[e.paidBy] = (net[e.paidBy] ?? 0) + e.amount;
    for (const p of e.split) net[p] = (net[p] ?? 0) - share;
  }
  const debt = Object.entries(net).filter(([, v]) => v < -0.5).map(([k, v]) => [k, -v] as [string, number]);
  const cred = Object.entries(net).filter(([, v]) => v > 0.5);
  const out: { from: string; to: string; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < debt.length && j < cred.length) {
    const amt = Math.min(debt[i][1], cred[j][1]);
    out.push({ from: debt[i][0], to: cred[j][0], amount: amt });
    debt[i][1] -= amt;
    cred[j][1] -= amt;
    if (debt[i][1] < 0.5) i++;
    if (cred[j][1] < 0.5) j++;
  }
  return out;
}

function Expenses() {
  const { bundle, me, save, remove } = useTrip();
  const { trip, expenses } = bundle!;
  const [editing, setEditing] = useState<Expense | null>(null);
  const dolar = useDolar();
  const sorted = [...expenses].sort((a, b) => b.createdAt - a.createdAt);
  const currencies = [...new Set(expenses.map((e) => e.currency))];
  const blank = (): Expense => ({
    id: docId(),
    title: "",
    amount: 0,
    currency: "ARS",
    paidBy: me!,
    split: trip.members,
    date: nowInTrip().day,
    createdAt: Date.now(),
  });

  return (
    <section className="stack">
      {dolar.length > 0 && (
        <div className="quotes">
          {dolar.map((q) => (
            <div key={q.casa}>
              <small>{q.nombre}</small>
              <b className="mono">{ars(q.venta)}</b>
            </div>
          ))}
        </div>
      )}

      {currencies.map((cur) => {
        const total = expenses.filter((e) => e.currency === cur).reduce((s, e) => s + e.amount, 0);
        const moves = settle(expenses, cur);
        return (
          <div key={cur} className="card balance">
            <div className="row between">
              <span className="eyebrow">Total {cur}</span>
              <b className="mono">{money(total, cur)}</b>
            </div>
            {moves.length === 0 ? (
              <p className="muted small">Están a mano.</p>
            ) : (
              <ul>
                {moves.map((m, k) => (
                  <li key={k}>
                    <b>{m.from}</b> le debe a <b>{m.to}</b> <span className="mono">{money(m.amount, cur)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <button className="btn primary" onClick={() => setEditing(blank())}>
        <IconPlus size={18} /> Anotar gasto
      </button>

      <ul className="expense-list">
        {sorted.map((e) => (
          <li key={e.id} onClick={() => setEditing(e)}>
            <div className="grow">
              <strong>{e.title || "Gasto"}</strong>
              <small>
                Pagó {e.paidBy} · {e.split.length === trip.members.length ? `entre ${e.split.length}` : `entre ${e.split.join(", ")}`}
              </small>
            </div>
            <span className="mono">{money(e.amount, e.currency)}</span>
          </li>
        ))}
      </ul>

      {editing && (
        <ExpenseForm
          expense={editing}
          members={trip.members}
          exists={expenses.some((x) => x.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(e) => save("expenses", e)}
          onDelete={() => remove("expenses", editing.id)}
        />
      )}
    </section>
  );
}

function ExpenseForm({
  expense,
  members,
  exists,
  onClose,
  onSave,
  onDelete,
}: {
  expense: Expense;
  members: string[];
  exists: boolean;
  onClose: () => void;
  onSave: (e: Expense) => void;
  onDelete: () => void;
}) {
  const [d, setD] = useState(expense);
  const [amount, setAmount] = useState(expense.amount ? String(expense.amount) : "");
  const submit = () => {
    const n = Number(amount.replace(/\./g, "").replace(",", "."));
    if (!n || !d.split.length) return;
    onSave({ ...d, amount: n });
    onClose();
  };
  return (
    <Sheet
      open
      onClose={onClose}
      title={exists ? "Editar gasto" : "Nuevo gasto"}
      footer={
        <>
          {exists && (
            <button className="btn ghost danger" onClick={() => (onDelete(), onClose())}>
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
        <input autoFocus={!exists} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="Cena, taxi, entradas…" />
      </label>
      <div className="grid2">
        <label className="field">
          <span>Monto</span>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </label>
        <div className="field">
          <span>Moneda</span>
          <div className="segmented">
            {(["ARS", "USD", "EUR"] as const).map((c) => (
              <button key={c} type="button" className={d.currency === c ? "on" : ""} onClick={() => setD({ ...d, currency: c })}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="field">
        <span>Pagó</span>
        <div className="chips wrap">
          {members.map((m) => (
            <button key={m} type="button" className={`chip ${d.paidBy === m ? "on" : ""}`} onClick={() => setD({ ...d, paidBy: m })}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Entre quiénes</span>
        <div className="chips wrap">
          {members.map((m) => (
            <button
              key={m}
              type="button"
              className={`chip ${d.split.includes(m) ? "on" : ""}`}
              onClick={() => setD({ ...d, split: d.split.includes(m) ? d.split.filter((x) => x !== m) : [...d.split, m] })}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

/* ---------- Notas ---------- */

function Notes() {
  const { bundle, save, remove } = useTrip();
  const [editing, setEditing] = useState<Note | null>(null);
  const notes = [...bundle!.notes].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt);
  return (
    <section className="stack">
      <p className="muted small">Vuelos, check-in, entradas, la dirección del hotel, el wifi. Todo lo que hay que tener a mano.</p>
      <button className="btn primary" onClick={() => setEditing({ id: docId(), title: "", body: "", links: [], updatedAt: Date.now() })}>
        <IconPlus size={18} /> Nueva nota
      </button>
      {notes.map((n) => (
        <article key={n.id} className="card note" onClick={() => setEditing(n)}>
          <h3>
            {n.pinned && <span className="tag">fijada</span>} {n.title || "Sin título"}
          </h3>
          {n.body && <p className="notes">{n.body}</p>}
          {n.links.length > 0 && (
            <div className="actions">
              {n.links.map((l, i) => (
                <a key={i} className="pill" href={l.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  <IconLink size={14} /> {l.label}
                </a>
              ))}
            </div>
          )}
        </article>
      ))}
      {editing && (
        <NoteForm
          note={editing}
          exists={bundle!.notes.some((n) => n.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(n) => save("notes", n)}
          onDelete={() => remove("notes", editing.id)}
        />
      )}
    </section>
  );
}

function NoteForm({
  note,
  exists,
  onClose,
  onSave,
  onDelete,
}: {
  note: Note;
  exists: boolean;
  onClose: () => void;
  onSave: (n: Note) => void;
  onDelete: () => void;
}) {
  const [d, setD] = useState(note);
  const [url, setUrl] = useState("");
  const withPending = () => {
    const u = url.trim();
    if (!u) return d.links;
    const full = /^https?:\/\//.test(u) ? u : `https://${u}`;
    let label = "Link";
    try {
      label = new URL(full).hostname.replace(/^www\./, "");
    } catch {}
    return [...d.links, { label, url: full }];
  };
  return (
    <Sheet
      open
      onClose={onClose}
      title={exists ? "Nota" : "Nueva nota"}
      footer={
        <>
          {exists && (
            <button className="btn ghost danger" onClick={() => confirm("¿Borrar la nota?") && (onDelete(), onClose())}>
              Borrar
            </button>
          )}
          <button
            className="btn primary grow"
            onClick={() => {
              if (!d.title.trim() && !d.body.trim()) return onClose();
              onSave({ ...d, links: withPending(), updatedAt: Date.now() });
              onClose();
            }}
          >
            Guardar
          </button>
        </>
      }
    >
      <label className="field">
        <span>Título</span>
        <input autoFocus={!exists} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="Vuelo de ida" />
      </label>
      <label className="field">
        <span>Detalle</span>
        <textarea rows={6} value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} placeholder="Código de reserva, horarios, dirección…" />
      </label>
      <div className="field">
        <span>Links</span>
        {d.links.map((l, i) => (
          <div key={i} className="row">
            <input value={l.label} onChange={(e) => setD({ ...d, links: d.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
            <button type="button" className="btn ghost small" onClick={() => setD({ ...d, links: d.links.filter((_, j) => j !== i) })}>
              Quitar
            </button>
          </div>
        ))}
        <div className="row">
          <input placeholder="https://…" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button
            type="button"
            className="icon-btn boxed"
            aria-label="Agregar link"
            onClick={() => {
              setD({ ...d, links: withPending() });
              setUrl("");
            }}
          >
            <IconPlus size={18} />
          </button>
        </div>
      </div>
      <label className="toggle">
        <input type="checkbox" checked={!!d.pinned} onChange={(e) => setD({ ...d, pinned: e.target.checked })} />
        Fijar arriba
      </label>
    </Sheet>
  );
}

/* ---------- Viaje / compartir ---------- */

function Settings() {
  const { bundle, me, setMe, patchTrip, toast } = useTrip();
  const { trip } = bundle!;
  const [form, setForm] = useState({ name: trip.name, destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate });
  const [newMember, setNewMember] = useState("");
  const link = typeof window !== "undefined" ? `${window.location.origin}/t/${trip.id}` : "";

  const share = async () => {
    const text = `Te paso el plan de ${trip.name}: ${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: trip.name, text, url: link });
      } catch {}
    } else {
      await navigator.clipboard.writeText(link);
      toast("Link copiado");
    }
  };

  return (
    <section className="stack">
      <div className="card share">
        <span className="eyebrow">Compartir</span>
        <p>Cualquiera con este link puede ver y editar el viaje. Mandalo sólo a quienes viajan.</p>
        <code className="link-box">{link}</code>
        <div className="row">
          <button className="btn primary grow" onClick={share}>
            <IconShare /> Compartir
          </button>
          <a className="btn grow" href={`https://wa.me/?text=${encodeURIComponent(`El plan del viaje: ${link}`)}`} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        </div>
      </div>

      <div className="card">
        <span className="eyebrow">Quiénes viajan</span>
        <ul className="members">
          {trip.members.map((m) => (
            <li key={m}>
              <span className="grow">
                {m} {m === me && <span className="tag">yo</span>}
              </span>
              {m !== me && (
                <button className="btn ghost small" onClick={() => setMe(m)}>
                  Soy yo
                </button>
              )}
              {m !== me && (
                <button className="btn ghost small danger" onClick={() => confirm(`¿Sacar a ${m}?`) && patchTrip({ removeMember: m })}>
                  Sacar
                </button>
              )}
            </li>
          ))}
        </ul>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            if (newMember.trim()) patchTrip({ addMember: newMember.trim() });
            setNewMember("");
          }}
        >
          <input value={newMember} onChange={(e) => setNewMember(e.target.value)} placeholder="Agregar persona" />
          <button className="btn">Agregar</button>
        </form>
      </div>

      <div className="card">
        <span className="eyebrow">Datos del viaje</span>
        <label className="field">
          <span>Nombre</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="field">
          <span>Destino</span>
          <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
        </label>
        <div className="grid2">
          <label className="field">
            <span>Desde</span>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </label>
          <label className="field">
            <span>Hasta</span>
            <input type="date" value={form.endDate} min={form.startDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </label>
        </div>
        <button
          className="btn primary"
          onClick={async () => {
            const patch: Record<string, unknown> = { ...form };
            if (form.destination !== trip.destination && form.destination.trim()) {
              const res = await fetch(`/api/place?q=${encodeURIComponent(form.destination)}`).catch(() => null);
              const [hit] = res?.ok ? await res.json() : [];
              if (hit) Object.assign(patch, { lat: hit.lat, lng: hit.lng });
            }
            patchTrip(patch);
            toast("Guardado");
          }}
        >
          Guardar cambios
        </button>
      </div>

      <Link className="btn ghost" href="/">
        Todos mis viajes
      </Link>
    </section>
  );
}
