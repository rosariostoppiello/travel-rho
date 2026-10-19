import { NextResponse } from "next/server";
import { getBundle, getTrip, saveTrip } from "@/lib/store";
import type { Trip } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const bundle = await getBundle(id);
  if (!bundle) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json(bundle, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const patch = (await req.json()) as Partial<Trip> & { addMember?: string; removeMember?: string };
  const next: Trip = { ...trip };
  for (const k of ["name", "destination", "startDate", "endDate", "lat", "lng"] as const) {
    if (k in patch) (next as unknown as Record<string, unknown>)[k] = patch[k];
  }
  if (patch.addMember && !next.members.includes(patch.addMember)) {
    next.members = [...next.members, patch.addMember.slice(0, 30)];
  }
  if (patch.removeMember) next.members = next.members.filter((m) => m !== patch.removeMember);
  await saveTrip(next);
  return NextResponse.json(next);
}
