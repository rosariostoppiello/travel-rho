import "server-only";
import { del, get, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

/**
 * Archivos adjuntos. En producción van a Vercel Blob en modo privado (sin el token
 * del servidor no se pueden abrir, aunque alguien tenga la URL). En local, a .data/files.
 */
const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const localDir = () => path.join(process.cwd(), ".data", "files");

export async function storeFile(tripId: string, fileId: string, body: ArrayBuffer, type: string) {
  if (blobEnabled()) {
    const blob = await put(`trips/${tripId}/${fileId}`, Buffer.from(body), {
      access: "private",
      addRandomSuffix: true,
      contentType: type,
    });
    return blob.url;
  }
  if (process.env.VERCEL) throw new Error("Falta conectar Vercel Blob al proyecto (Storage → Blob).");
  await fs.mkdir(localDir(), { recursive: true });
  const file = path.join(localDir(), `${tripId}_${fileId}`);
  await fs.writeFile(file, Buffer.from(body));
  return `local:${path.basename(file)}`;
}

export async function readFile(location: string): Promise<ReadableStream<Uint8Array> | Buffer | null> {
  if (location.startsWith("local:")) {
    try {
      return await fs.readFile(path.join(localDir(), path.basename(location.slice(6))));
    } catch {
      return null;
    }
  }
  const res = await get(location, { access: "private" });
  return res?.statusCode === 200 ? res.stream : null;
}

export async function removeFile(location: string) {
  if (location.startsWith("local:")) {
    await fs.rm(path.join(localDir(), path.basename(location.slice(6))), { force: true });
  } else {
    await del(location);
  }
}
