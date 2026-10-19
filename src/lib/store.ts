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
}

function redisBackend(): Backend | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const r = new Redis({ url, token, automaticDeserialization: false });
  return {
    get: (k) => r.get<string>(k),
    set: async (k, v) => void (await r.set(k, v)),
    hgetall: async (k) => (await r.hgetall<Record<string, string>>(k)) ?? {},
    hset: async (k, f, v) => void (await r.hset(k, { [f]: v })),
    hdel: async (k, f) => void (await r.hdel(k, f)),
  };
}

function fileBackend(): Backend {
  const file = path.join(process.cwd(), ".data", "db.json");
  type Db = { kv: Record<string, string>; h: Record<string, Record<string, string>> };
  // Se lee una vez y se mantiene en memoria; las escrituras se encolan para no pisarse.
  let cache: Promise<Db> | null = null;
  let writing = Promise.resolve();
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

export async function getBundle(id: string): Promise<TripBundle | null> {
  const trip = await getTrip(id);
  if (!trip) return null;
  const [items, packing, expenses, notes] = await Promise.all(
    (["items", "packing", "expenses", "notes"] as Collection[]).map((c) => db().hgetall(`trip:${id}:${c}`)),
  );
  return {
    trip,
    items: values(items),
    packing: values(packing),
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
