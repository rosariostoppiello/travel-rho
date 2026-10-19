import { NextResponse } from "next/server";
import { deleteTemplate, listTemplates, saveTemplate } from "@/lib/store";
import { DEFAULT_TEMPLATES } from "@/lib/defaults";
import type { Template } from "@/lib/types";

export async function GET() {
  const saved = await listTemplates();
  const ids = new Set(saved.map((t) => t.id));
  // Las de fábrica aparecen hasta que se guarde una versión propia con el mismo id.
  const all = [...saved, ...DEFAULT_TEMPLATES.filter((t) => !ids.has(t.id))];
  return NextResponse.json(all.sort((a, b) => a.name.localeCompare(b.name)), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(req: Request) {
  const t = (await req.json()) as Template;
  if (!t.id || !t.name) return NextResponse.json({ error: "Falta id o nombre" }, { status: 400 });
  await saveTemplate({ ...t, updatedAt: Date.now() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  await deleteTemplate(id);
  return NextResponse.json({ ok: true });
}
