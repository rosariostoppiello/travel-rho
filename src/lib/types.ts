export type Category =
  | "comida"
  | "paseo"
  | "shopping"
  | "cultura"
  | "evento"
  | "transporte"
  | "alojamiento"
  | "otro";

export type TransportMode = "caminando" | "subte" | "colectivo" | "taxi" | "auto" | "tren" | "avion" | "otro";

export interface Link {
  label: string;
  url: string;
}

export interface Place {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  mapsUrl?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string; // MIME
  size: number;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  members: string[];
  lat?: number; // para el clima
  lng?: number;
  createdAt: number;
  pinHash?: string; // sólo en el servidor; al cliente le llega hasPin
  hasPin?: boolean;
}

export interface Item {
  id: string;
  day: string; // YYYY-MM-DD
  start: string; // HH:MM
  end?: string;
  title: string;
  category: Category;
  place?: Place;
  transport?: { mode: TransportMode; from?: string; to?: string };
  links: Link[];
  files?: Attachment[];
  notes?: string;
  cost?: string;
  updatedBy?: string;
  updatedAt?: number;
}

export interface PackItem {
  id: string;
  list: string;
  text: string;
  qty?: number;
  packed: boolean;
  who?: string;
  order: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: "ARS" | "USD" | "EUR";
  paidBy: string;
  split: string[];
  date: string;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  links: Link[];
  files?: Attachment[];
  pinned?: boolean;
  updatedAt: number;
}

export interface Template {
  id: string;
  name: string;
  items: { list: string; text: string; qty?: number }[];
  updatedAt: number;
}

export interface TripBundle {
  trip: Trip;
  items: Item[];
  packing: PackItem[];
  expenses: Expense[];
  notes: Note[];
}

export const COLLECTIONS = ["items", "packing", "expenses", "notes"] as const;
export type Collection = (typeof COLLECTIONS)[number];
