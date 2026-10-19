import { NextResponse } from "next/server";
import { getTrip, remove, upsert } from "@/lib/store";
import { COLLECTIONS, type Collection } from "@/lib/types";

type Ctx = { params: Promise<{ id: string; collection: string }> };

async function check(params: Ctx["params"]) {
  const { id, collection } = await params;
  if (!COLLECTIONS.includes(collection as Collection)) return null;
  if (!(await getTrip(id))) return null;
  return { id, col: collection as Collection };
}

// PUT con un doc o una lista de docs (para cargar una plantilla entera de una).
export async function PUT(req: Request, { params }: Ctx) {
  const c = await check(params);
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const body = await req.json();
  const docs: { id: string }[] = Array.isArray(body) ? body : [body];
  if (docs.some((d) => typeof d?.id !== "string" || !d.id)) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }
  await Promise.all(docs.map((d) => upsert(c.id, c.col, d)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const c = await check(params);
  if (!c) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const docId = new URL(req.url).searchParams.get("doc");
  if (!docId) return NextResponse.json({ error: "Falta doc" }, { status: 400 });
  await remove(c.id, c.col, docId);
  return NextResponse.json({ ok: true });
}
