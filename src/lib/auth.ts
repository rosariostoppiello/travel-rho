import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { countAttempt, getTrip } from "./store";
import type { Trip } from "./types";

/**
 * PIN opcional por viaje. Si el viaje tiene PIN, cada dispositivo lo ingresa una vez
 * y queda una cookie httpOnly firmada; sin ella la API no devuelve ni guarda nada.
 */
function secret() {
  const s =
    process.env.APP_SECRET ?? process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!s && process.env.VERCEL) throw new Error("Falta APP_SECRET o la base de datos conectada");
  return s ?? "solo-para-desarrollo-local";
}

const hmac = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");

export const hashPin = (tripId: string, pin: string) => hmac(`pin:${tripId}:${pin}`);

// Si cambia el PIN, cambia el hash y las cookies viejas dejan de servir.
const sessionValue = (trip: Trip) => hmac(`session:${trip.id}:${trip.pinHash}`);
const cookieName = (tripId: string) => `trip_${tripId}`;

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function isAuthorized(trip: Trip) {
  if (!trip.pinHash) return true;
  const c = (await cookies()).get(cookieName(trip.id))?.value;
  return !!c && same(c, sessionValue(trip));
}

export function setSessionCookie(res: NextResponse, trip: Trip) {
  if (!trip.pinHash) {
    res.cookies.delete(cookieName(trip.id));
    return;
  }
  res.cookies.set(cookieName(trip.id), sessionValue(trip), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

/** Carga el viaje y verifica acceso; devuelve el viaje o la respuesta de error lista. */
export async function guard(tripId: string): Promise<{ trip: Trip } | { error: NextResponse }> {
  const trip = await getTrip(tripId);
  if (!trip) return { error: NextResponse.json({ error: "No existe" }, { status: 404 }) };
  if (!(await isAuthorized(trip))) {
    return { error: NextResponse.json({ error: "Falta el PIN", locked: true, name: trip.name }, { status: 401 }) };
  }
  return { trip };
}

export async function checkPin(trip: Trip, pin: string): Promise<"ok" | "wrong" | "blocked"> {
  // 8 intentos cada 15 minutos por viaje: probar PINs a ciegas no es viable.
  const attempts = await countAttempt(`pinfail:${trip.id}`, 15 * 60);
  if (attempts > 8) return "blocked";
  return trip.pinHash && same(hashPin(trip.id, pin), trip.pinHash) ? "ok" : "wrong";
}
