import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { readFile, removeFile } from "@/lib/files";
import { deleteFileRef, getFileRef } from "@/lib/store";

type Ctx = { params: Promise<{ id: string; fileId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id, fileId } = await params;
  const g = await guard(id);
  if ("error" in g) return g.error;
  const ref = await getFileRef(id, fileId);
  const body = ref && (await readFile(ref.location));
  if (!ref || !body) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": ref.type,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(ref.name)}`,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      // El visor de PDF de Chrome no abre en modo sandbox; a las imágenes sí se lo ponemos.
      ...(ref.type === "application/pdf" ? {} : { "Content-Security-Policy": "sandbox" }),
    },
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id, fileId } = await params;
  const g = await guard(id);
  if ("error" in g) return g.error;
  const ref = await getFileRef(id, fileId);
  if (ref) {
    await removeFile(ref.location).catch(() => {});
    await deleteFileRef(id, fileId);
  }
  return NextResponse.json({ ok: true });
}
