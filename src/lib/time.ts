import type { Item } from "./types";

export const TZ = "America/Argentina/Buenos_Aires";

/** Fecha y hora "de pared" en Argentina, sin importar dónde esté el teléfono. */
export function nowInTrip(): { day: string; minutes: number; date: Date } {
  const date = new Date();
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    date,
  };
}

export const toMin = (hhmm?: string) => {
  if (!hhmm) return NaN;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const fmtDuration = (min: number) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m}` : `${h} h`;
};

export function daysBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(start + "T12:00:00Z");
  const e = new Date(end + "T12:00:00Z");
  while (d <= e && out.length < 60) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function dayLabel(day: string) {
  const d = new Date(day + "T12:00:00Z");
  return {
    weekday: WEEKDAYS[d.getUTCDay()],
    short: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`,
    num: d.getUTCDate(),
  };
}

export const sortItems = (items: Item[]) =>
  [...items].sort((a, b) => a.day.localeCompare(b.day) || a.start.localeCompare(b.start));

/** Si no tiene hora de fin, asumimos que dura hasta que arranca lo siguiente (o 1 h). */
export function endMinutes(item: Item, next?: Item) {
  if (item.end) return toMin(item.end);
  if (next && next.day === item.day) return toMin(next.start);
  return toMin(item.start) + 60;
}
