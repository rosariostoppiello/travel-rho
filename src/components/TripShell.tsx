"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconBag, IconMap, IconMore, IconNow, IconPlan } from "./Icons";
import { useTrip } from "./TripProvider";

const TABS = [
  { href: "", label: "Ahora", Icon: IconNow },
  { href: "/plan", label: "Plan", Icon: IconPlan },
  { href: "/mapa", label: "Mapa", Icon: IconMap },
  { href: "/valija", label: "Valija", Icon: IconBag },
  { href: "/mas", label: "Más", Icon: IconMore },
];

export function TripShell({ id, children }: { id: string; children: React.ReactNode }) {
  const { bundle, error, me, locked } = useTrip();
  const path = usePathname();
  const base = `/t/${id}`;

  if (locked) return <PinScreen name={locked} />;
  if (error && !bundle) {
    return (
      <main className="center-screen">
        <p className="eyebrow">Ups</p>
        <h1 className="display">{error}</h1>
        <Link className="btn" href="/">
          Ir al inicio
        </Link>
      </main>
    );
  }
  if (!bundle) return <main className="center-screen"><div className="loader" /></main>;
  if (!me) return <WhoAreYou />;

  return (
    <>
      <div className="page">{children}</div>
      <nav className="tabbar">
        {TABS.map(({ href, label, Icon }) => {
          const full = base + href;
          const active = href ? path.startsWith(full) : path === base;
          return (
            <Link key={label} href={full} className={active ? "on" : ""}>
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function WhoAreYou() {
  const { bundle, setMe } = useTrip();
  const [name, setName] = useState("");
  const trip = bundle!.trip;
  return (
    <main className="center-screen welcome">
      <p className="eyebrow">{trip.destination || "Viaje"}</p>
      <h1 className="display">{trip.name}</h1>
      <p className="muted">¿Quién sos? Así sabemos de quién es cada cosa en la valija y en los gastos.</p>
      <div className="who-list">
        {trip.members.map((m) => (
          <button key={m} className="btn big" onClick={() => setMe(m)}>
            {m}
          </button>
        ))}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) setMe(name.trim());
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={trip.members.length ? "Otra persona" : "Tu nombre"} />
        <button className="btn primary">Entrar</button>
      </form>
    </main>
  );
}

function PinScreen({ name }: { name: string }) {
  const { unlock } = useTrip();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <main className="center-screen welcome">
      <p className="eyebrow">Viaje protegido</p>
      <h1 className="display">{name}</h1>
      <p className="muted">Ingresá el PIN del viaje. Se pide una sola vez en este dispositivo.</p>
      <form
        className="row"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(await unlock(pin));
          setBusy(false);
        }}
      >
        <input
          className="pin-input mono"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="••••"
        />
        <button className="btn primary" disabled={busy || pin.length < 4}>
          Entrar
        </button>
      </form>
      {err && <p className="hint err">{err}</p>}
    </main>
  );
}
