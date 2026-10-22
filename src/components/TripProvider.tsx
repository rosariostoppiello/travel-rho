"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Collection, Trip, TripBundle } from "@/lib/types";

type Doc = { id: string };

interface Ctx {
  bundle: TripBundle | null;
  error: string | null;
  locked: string | null; // nombre del viaje si pide PIN
  unlock: (pin: string) => Promise<string | null>;
  me: string | null;
  setMe: (name: string) => void;
  save: <T extends Doc>(col: Collection, doc: T | T[]) => Promise<void>;
  remove: (col: Collection, id: string) => Promise<void>;
  patchTrip: (patch: Partial<Trip> & { addMember?: string; removeMember?: string }) => Promise<void>;
  refresh: () => Promise<void>;
  toast: (msg: string) => void;
}

const TripCtx = createContext<Ctx | null>(null);

export const useTrip = () => {
  const c = useContext(TripCtx);
  if (!c) throw new Error("useTrip fuera de TripProvider");
  return c;
};

/** Para que la home muestre los viajes abiertos en este teléfono. */
export function rememberTrip(t: Trip) {
  try {
    const list: Trip[] = JSON.parse(localStorage.getItem("travel:trips") || "[]");
    const next = [t, ...list.filter((x) => x.id !== t.id)].slice(0, 20);
    localStorage.setItem("travel:trips", JSON.stringify(next));
  } catch {}
}

export function TripProvider({ id, children }: { id: string; children: React.ReactNode }) {
  const [bundle, setBundle] = useState<TripBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState<string | null>(null);
  const [me, setMeState] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const pending = useRef(0);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((m) => (m === msg ? null : m)), 2600);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${id}`, { cache: "no-store" });
      if (res.status === 404) return setError("Este viaje no existe (o el link está mal copiado).");
      if (res.status === 401) {
        const body = await res.json();
        setBundle(null);
        return setLocked(body.name ?? "Viaje");
      }
      if (!res.ok) throw new Error();
      setLocked(null);
      const data = (await res.json()) as TripBundle;
      // Si hay cambios propios en vuelo, no los pisamos con datos viejos.
      if (pending.current === 0) setBundle(data);
      setError(null);
      rememberTrip(data.trip);
    } catch {
      if (!bundle) setError("No hay conexión. Probá de nuevo en un rato.");
    }
  }, [id, bundle]);

  useEffect(() => {
    try {
      setMeState(localStorage.getItem(`travel:me:${id}`));
    } catch {}
  }, [id]);

  useEffect(() => {
    refresh();
    const t = setInterval(() => document.visibilityState === "visible" && refresh(), 15000);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const mutate = useCallback(
    async (apply: (b: TripBundle) => TripBundle, request: () => Promise<Response>) => {
      setBundle((b) => (b ? apply(b) : b));
      pending.current++;
      try {
        const res = await request();
        if (res.status === 401) setLocked(bundle?.trip.name ?? "Viaje");
        if (!res.ok) throw new Error();
      } catch {
        toast("No se pudo guardar. Revisá la conexión.");
      } finally {
        pending.current--;
        if (pending.current === 0) refresh();
      }
    },
    [refresh, toast, bundle],
  );

  const unlock = useCallback(
    async (pin: string) => {
      const res = await fetch(`/api/trips/${id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      }).catch(() => null);
      if (!res) return "Sin conexión";
      if (!res.ok) return ((await res.json()).error as string) ?? "No se pudo";
      await refresh();
      return null;
    },
    [id, refresh],
  );

  const save = useCallback(
    <T extends Doc>(col: Collection, doc: T | T[]) => {
      const docs = Array.isArray(doc) ? doc : [doc];
      return mutate(
        (b) => {
          const list = b[col] as unknown as Doc[];
          const ids = new Set(docs.map((d) => d.id));
          return { ...b, [col]: [...list.filter((x) => !ids.has(x.id)), ...docs] };
        },
        () =>
          fetch(`/api/trips/${id}/${col}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(doc),
          }),
      );
    },
    [id, mutate],
  );

  const remove = useCallback(
    (col: Collection, docId: string) =>
      mutate(
        (b) => ({ ...b, [col]: (b[col] as unknown as Doc[]).filter((x) => x.id !== docId) }),
        () => fetch(`/api/trips/${id}/${col}?doc=${encodeURIComponent(docId)}`, { method: "DELETE" }),
      ),
    [id, mutate],
  );

  const patchTrip = useCallback(
    (patch: Partial<Trip> & { addMember?: string; removeMember?: string }) =>
      mutate(
        (b) => {
          const { addMember, removeMember, ...rest } = patch;
          let members = b.trip.members;
          if (addMember && !members.includes(addMember)) members = [...members, addMember];
          if (removeMember) members = members.filter((m) => m !== removeMember);
          return { ...b, trip: { ...b.trip, ...rest, members } };
        },
        () =>
          fetch(`/api/trips/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          }),
      ),
    [id, mutate],
  );

  const setMe = useCallback(
    (name: string) => {
      try {
        localStorage.setItem(`travel:me:${id}`, name);
      } catch {}
      setMeState(name);
      if (bundle && !bundle.trip.members.includes(name)) patchTrip({ addMember: name });
    },
    [id, bundle, patchTrip],
  );

  return (
    <TripCtx.Provider value={{ bundle, error, locked, unlock, me, setMe, save, remove, patchTrip, refresh, toast }}>
      {children}
      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
    </TripCtx.Provider>
  );
}
