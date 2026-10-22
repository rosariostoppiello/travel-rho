import { NextResponse } from "next/server";
import { checkPin, setSessionCookie } from "@/lib/auth";
import { getTrip } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const { pin } = (await req.json()) as { pin?: string };
  const result = await checkPin(trip, String(pin ?? ""));
  if (result === "blocked") {
    return NextResponse.json({ error: "Demasiados intentos. Probá en 15 minutos." }, { status: 429 });
  }
  if (result === "wrong") return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, trip);
  return res;
}
