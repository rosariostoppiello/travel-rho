import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { storeFile } from "@/lib/files";
import { docId } from "@/lib/id";
import { saveFileRef } from "@/lib/store";
import type { Attachment } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

// Vercel corta los cuerpos en 4,5 MB; las fotos se achican en el celu antes de subir.
const MAX = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const g = await guard(id);
  if ("error" in g) return g.error;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Sólo fotos (JPG, PNG) o PDF" }, { status: 400 });
  }
  if (file.size > MAX) return NextResponse.json({ error: "Muy pesado (máx. 4 MB)" }, { status: 413 });

  const fileId = docId();
  try {
    const location = await storeFile(id, fileId, await file.arrayBuffer(), file.type);
    const meta: Attachment = { id: fileId, name: file.name.slice(0, 120) || "archivo", type: file.type, size: file.size };
    await saveFileRef(id, { ...meta, location, createdAt: Date.now() });
    return NextResponse.json(meta);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
