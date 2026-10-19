import { customAlphabet } from "nanoid";

// Sin caracteres ambiguos; 12 de largo alcanza para que el link no se adivine.
export const tripId = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 12);
export const docId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);
