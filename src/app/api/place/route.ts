import { NextResponse } from "next/server";
import type { Place } from "@/lib/types";

/**
 * GET ?url=<link de Google/Apple Maps>  → intenta sacar coordenadas y nombre
 * GET ?q=<texto>                         → busca en OpenStreetMap (Nominatim)
 */
const UA = "travel-rho/1.0 (uso personal)";
const ALLOWED = /(^|\.)(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl|apple\.com)$/;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const url = sp.get("url");
  const q = sp.get("q");
  try {
    if (url) return NextResponse.json(await fromLink(url));
    if (q) return NextResponse.json(await search(q, sp.get("near")));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  return NextResponse.json({ error: "Falta url o q" }, { status: 400 });
}

async function fromLink(input: string): Promise<Place> {
  let current = input.trim();
  for (let hop = 0; hop < 5; hop++) {
    const u = new URL(current);
    if (!ALLOWED.test(u.hostname)) throw new Error("Sólo links de Google Maps o Apple Maps");
    const parsed = parse(u);
    if (parsed.lat !== undefined) return { name: "Lugar marcado", ...parsed, mapsUrl: input };
    const isShort = /goo\.gl$/.test(u.hostname);
    if (!isShort) {
      if (parsed.name) {
        const [hit] = await search(parsed.name);
        if (hit) return { ...hit, name: parsed.name, mapsUrl: input };
        return { name: parsed.name, mapsUrl: input };
      }
      break;
    }
    const res = await fetch(current, { redirect: "manual", headers: { "User-Agent": UA } });
    const loc = res.headers.get("location");
    if (!loc) break;
    current = new URL(loc, current).toString();
  }
  throw new Error("No pude leer la ubicación de ese link");
}

function parse(u: URL): Partial<Place> {
  const href = decodeURIComponent(u.href);
  const out: Partial<Place> = {};
  const placeName = href.match(/\/place\/([^/@]+)/)?.[1];
  if (placeName) out.name = placeName.replace(/\+/g, " ");

  const precise = href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const at = href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const qp = ["q", "query", "ll", "destination", "daddr", "sll"]
    .map((k) => u.searchParams.get(k))
    .find(Boolean);
  const qCoords = qp?.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  const m = precise ?? qCoords ?? at;
  if (m) {
    out.lat = Number(m[1]);
    out.lng = Number(m[2]);
  }
  if (!out.name && qp && !qCoords) out.name = qp.replace(/\+/g, " ");
  return out;
}

async function search(q: string, near?: string | null): Promise<Place[]> {
  const params = new URLSearchParams({ q, format: "jsonv2", limit: "6", "accept-language": "es", countrycodes: "ar" });
  if (near) {
    const [lat, lng] = near.split(",").map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      params.set("viewbox", `${lng - 0.4},${lat + 0.4},${lng + 0.4},${lat - 0.4}`);
    }
  }
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error("La búsqueda no respondió");
  const rows = (await res.json()) as { name: string; display_name: string; lat: string; lon: string }[];
  return rows.map((r) => ({
    name: r.name || r.display_name.split(",")[0],
    address: r.display_name.split(",").slice(1, 4).join(",").trim(),
    lat: Number(r.lat),
    lng: Number(r.lon),
  }));
}
