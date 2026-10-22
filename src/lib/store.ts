import "server-only";
import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import type { Collection, Template, Trip, TripBundle } from "./types";

/**
 * Almacenamiento mínimo: un JSON por viaje + un hash por colección.
 * En producción usa Upstash Redis (integración de Vercel); en local, un archivo en .data/.
 */
interface Backend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  hgetall(key: string): Promise<Record<string, string>>;
  hset(key: string, field: string, value: string): Promise<void>;
  hdel(key: string, field: string): Promise<void>;
  incr(key: string, ttlSec: number): Promise<number>;
}

function redisBackend(): Backend | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const r = new Redis({ url, token, automaticDeserialization: false });
  return {
    get: (k) => r.get<string>(k),
    set: async (k, v) => void (await r.set(k, v)),
    // Sin deserialización automática, HGETALL llega como [campo, valor, campo, valor…].
    hgetall: async (k) => {
      const raw = (await r.hgetall(k)) as unknown as string[] | Record<string, string> | null;
      if (!Array.isArray(raw)) return raw ?? {};
      const out: Record<string, string> = {};
      for (let i = 0; i < raw.length; i += 2) out[raw[i]] = raw[i + 1];
      return out;
    },
    hset: async (k, f, v) => void (await r.hset(k, { [f]: v })),
    hdel: async (k, f) => void (await r.hdel(k, f)),
    incr: async (k, ttl) => {
      const n = await r.incr(k);
      if (n === 1) await r.expire(k, ttl);
      return n;
    },
  };
}

function fileBackend(): Backend {
  const file = path.join(process.cwd(), ".data", "db.json");
  type Db = { kv: Record<string, string>; h: Record<string, Record<string, string>> };
  // Se lee una vez y se mantiene en memoria; las escrituras se encolan para no pisarse.
  let cache: Promise<Db> | null = null;
  let writing = Promise.resolve();
  const counters = new Map<string, { n: number; until: number }>();
  const load = (): Promise<Db> =>
    (cache ??= fs
      .readFile(file, "utf8")
      .then((s) => JSON.parse(s) as Db)
      .catch(() => ({ kv: {}, h: {} })));
  const save = (db: Db) =>
    (writing = writing.then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(db, null, 1));
    }));
  return {
    get: async (k) => (await load()).kv[k] ?? null,
    set: async (k, v) => {
      const db = await load();
      db.kv[k] = v;
      await save(db);
    },
    hgetall: async (k) => (await load()).h[k] ?? {},
    hset: async (k, f, v) => {
      const db = await load();
      (db.h[k] ??= {})[f] = v;
      await save(db);
    },
    hdel: async (k, f) => {
      const db = await load();
      delete db.h[k]?.[f];
      await save(db);
    },
    incr: async (k, ttl) => {
      const now = Date.now();
      const c = counters.get(k);
      const next = c && c.until > now ? { n: c.n + 1, until: c.until } : { n: 1, until: now + ttl * 1000 };
      counters.set(k, next);
      return next.n;
    },
  };
}

let backend: Backend | undefined;
function db(): Backend {
  if (!backend) {
    const redis = redisBackend();
    if (!redis && process.env.VERCEL) {
      throw new Error("Falta conectar Upstash Redis al proyecto en Vercel (Storage → Upstash).");
    }
    backend = redis ?? fileBackend();
  }
  return backend;
}

const values = <T>(h: Record<string, string>): T[] =>
  Object.values(h).map((v) => (typeof v === "string" ? JSON.parse(v) : v) as T);

export async function getTrip(id: string): Promise<Trip | null> {
  const raw = await db().get(`trip:${id}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : (raw as Trip);
}

export async function saveTrip(trip: Trip) {
  await db().set(`trip:${trip.id}`, JSON.stringify(trip));
}

/** Lo que ve el navegador: nunca el hash del PIN. */
export function publicTrip(trip: Trip): Trip {
  const { pinHash, ...rest } = trip;
  return { ...rest, hasPin: !!pinHash };
}

export async function getBundle(id: string): Promise<TripBundle | null> {
  const raw = await getTrip(id);
  if (!raw) return null;
  const trip = publicTrip(raw);
  const [items, packing, bags, expenses, notes] = await Promise.all(
    (["items", "packing", "bags", "expenses", "notes"] as Collection[]).map((c) => db().hgetall(`trip:${id}:${c}`)),
  );
  return {
    trip,
    items: values(items),
    packing: values(packing),
    bags: values(bags),
    expenses: values(expenses),
    notes: values(notes),
  };
}

export async function upsert(tripId: string, col: Collection, doc: { id: string }) {
  await db().hset(`trip:${tripId}:${col}`, doc.id, JSON.stringify(doc));
}

export async function remove(tripId: string, col: Collection, docId: string) {
  await db().hdel(`trip:${tripId}:${col}`, docId);
}

export async function listTemplates(): Promise<Template[]> {
  return values<Template>(await db().hgetall("templates"));
}

export async function saveTemplate(t: Template) {
  await db().hset("templates", t.id, JSON.stringify(t));
}

export async function deleteTemplate(id: string) {
  await db().hdel("templates", id);
}

export const countAttempt = (key: string, ttlSec: number) => db().incr(key, ttlSec);

// Referencias a archivos: separadas del bundle para que la ubicación real nunca llegue al cliente.
export async function getFileRef(tripId: string, fileId: string): Promise<FileRef | null> {
  const raw = (await db().hgetall(`trip:${tripId}:files`))[fileId];
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : (raw as FileRef);
}

export async function saveFileRef(tripId: string, ref: FileRef) {
  await db().hset(`trip:${tripId}:files`, ref.id, JSON.stringify(ref));
}

export async function deleteFileRef(tripId: string, fileId: string) {
  await db().hdel(`trip:${tripId}:files`, fileId);
}

export interface FileRef {
  id: string;
  name: string;
  type: string;
  size: number;
  location: string; // URL de Vercel Blob o ruta local en dev
  createdAt: number;
}
