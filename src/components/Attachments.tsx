"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Attachment } from "@/lib/types";
import { IconClose, IconFile, IconPaperclip } from "./Icons";
import { useTrip } from "./TripProvider";

const fileUrl = (tripId: string, f: Attachment) => `/api/trips/${tripId}/files/${f.id}`;
const isImage = (f: Attachment) => f.type.startsWith("image/");

/** Achica fotos grandes a ~2000 px en JPEG: un QR se sigue leyendo perfecto y sube rápido con datos. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < 900_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function AttachmentEditor({ files, onChange }: { files: Attachment[]; onChange: (f: Attachment[]) => void }) {
  const { bundle } = useTrip();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const tripId = bundle!.trip.id;

  const upload = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setErr(null);
    const added: Attachment[] = [];
    for (const original of Array.from(list)) {
      const file = await shrink(original);
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/trips/${tripId}/files`, { method: "POST", body: form }).catch(() => null);
      const data = res && (await res.json().catch(() => null));
      if (!res?.ok || !data) {
        setErr(data?.error ?? "No se pudo subir");
        continue;
      }
      added.push(data);
    }
    onChange([...files, ...added]);
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  return (
    <div className="attach-editor">
      {files.length > 0 && <AttachmentList files={files} onRemove={(f) => onChange(files.filter((x) => x.id !== f.id))} />}
      <button type="button" className="btn small" onClick={() => input.current?.click()} disabled={busy}>
        <IconPaperclip size={15} /> {busy ? "Subiendo…" : "Adjuntar foto o PDF"}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        multiple
        hidden
        onChange={(e) => upload(e.target.files)}
      />
      {err && <p className="hint err">{err}</p>}
    </div>
  );
}

export function AttachmentList({ files, onRemove }: { files: Attachment[]; onRemove?: (f: Attachment) => void }) {
  const { bundle } = useTrip();
  const [open, setOpen] = useState<Attachment | null>(null);
  const tripId = bundle!.trip.id;
  if (!files.length) return null;
  return (
    <div className="attachments" onClick={(e) => e.stopPropagation()}>
      {files.map((f) => (
        <div key={f.id} className="attachment">
          {isImage(f) ? (
            <button type="button" className="thumb" onClick={() => setOpen(f)} aria-label={`Ver ${f.name}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(tripId, f)} alt={f.name} loading="lazy" />
            </button>
          ) : (
            <a className="pill" href={fileUrl(tripId, f)} target="_blank" rel="noreferrer">
              <IconFile size={14} /> {f.name}
            </a>
          )}
          {onRemove && (
            <button type="button" className="remove" onClick={() => onRemove(f)} aria-label={`Quitar ${f.name}`}>
              <IconClose size={13} />
            </button>
          )}
        </div>
      ))}
      {open &&
        createPortal(
          <div className="viewer" onClick={() => setOpen(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl(tripId, open)} alt={open.name} />
            <div className="viewer-bar">
              <span>{open.name}</span>
              <button className="icon-btn" aria-label="Cerrar">
                <IconClose />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/** Al guardar: borra del almacenamiento lo que se sacó del formulario. */
export function dropRemoved(tripId: string, before: Attachment[] = [], after: Attachment[] = []) {
  const keep = new Set(after.map((f) => f.id));
  for (const f of before) {
    if (!keep.has(f.id)) fetch(`/api/trips/${tripId}/files/${f.id}`, { method: "DELETE" }).catch(() => {});
  }
}
