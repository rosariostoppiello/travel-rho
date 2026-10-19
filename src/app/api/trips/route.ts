import { NextResponse } from "next/server";
import { saveTrip } from "@/lib/store";
import { tripId } from "@/lib/id";
import type { Trip } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json();
  const required = process.env.APP_PASSWORD;
  if (required && body.password !== required) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  const trip: Trip = {
    id: tripId(),
    name: String(body.name || "Viaje").slice(0, 80),
    destination: String(body.destination || "").slice(0, 80),
    startDate: body.startDate,
    endDate: body.endDate || body.startDate,
    members: body.me ? [String(body.me).slice(0, 30)] : [],
    lat: body.lat,
    lng: body.lng,
    createdAt: Date.now(),
  };
  await saveTrip(trip);
  return NextResponse.json(trip);
}
