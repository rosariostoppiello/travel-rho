import { NextResponse } from "next/server";
import { guard, hashPin, setSessionCookie } from "@/lib/auth";
import { getBundle, publicTrip, saveTrip } from "@/lib/store";
import type { Trip } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const g = await guard(id);
  if ("error" in g) return g.error;
  const bundle = await getBundle(id);
  return NextResponse.json(bundle, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const g = await guard(id);
  if ("error" in g) return g.error;
  const patch = (await req.json()) as Partial<Trip> & { addMember?: string; removeMember?: string; pin?: string | null };
  const next: Trip = { ...g.trip };
  for (const k of ["name", "destination", "startDate", "endDate", "lat", "lng"] as const) {
    if (k in patch) (next as unknown as Record<string, unknown>)[k] = patch[k];
  }
  if (patch.addMember && !next.members.includes(patch.addMember)) {
    next.members = [...next.members, patch.addMember.slice(0, 30)];
  }
  if (patch.removeMember) next.members = next.members.filter((m) => m !== patch.removeMember);
  if ("pin" in patch) {
    if (patch.pin === null) delete next.pinHash;
    else if (typeof patch.pin === "string" && /^\d{4,8}$/.test(patch.pin)) next.pinHash = hashPin(id, patch.pin);
    else return NextResponse.json({ error: "El PIN tiene que ser de 4 a 8 números" }, { status: 400 });
  }
  await saveTrip(next);
  const res = NextResponse.json(publicTrip(next));
  // Quien pone o cambia el PIN queda adentro en este dispositivo.
  if ("pin" in patch) setSessionCookie(res, next);
  return res;
}
