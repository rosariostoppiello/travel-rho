import type { Category, TransportMode } from "./types";

export const CATEGORIES: Record<Category, { label: string; color: string }> = {
  comida: { label: "Comida", color: "var(--c-comida)" },
  paseo: { label: "Paseo", color: "var(--c-paseo)" },
  shopping: { label: "Shopping", color: "var(--c-shopping)" },
  cultura: { label: "Cultura", color: "var(--c-cultura)" },
  evento: { label: "Evento", color: "var(--c-evento)" },
  transporte: { label: "Traslado", color: "var(--c-transporte)" },
  alojamiento: { label: "Alojamiento", color: "var(--c-alojamiento)" },
  otro: { label: "Otro", color: "var(--c-otro)" },
};

// Mismos tonos en hex para Leaflet, que no lee variables CSS.
export const CATEGORY_HEX: Record<Category, string> = {
  comida: "#d4762c",
  paseo: "#4c8a57",
  shopping: "#b04a78",
  cultura: "#3c6ea5",
  evento: "#b8322f",
  transporte: "#6b7078",
  alojamiento: "#8a6a3a",
  otro: "#8c8577",
};

export const CATEGORY_ORDER = Object.keys(CATEGORIES) as Category[];

export const TRANSPORT: Record<TransportMode, string> = {
  caminando: "Caminando",
  subte: "Subte",
  colectivo: "Colectivo",
  taxi: "Taxi / Uber",
  auto: "Auto",
  tren: "Tren",
  avion: "Avión",
  otro: "Otro",
};
