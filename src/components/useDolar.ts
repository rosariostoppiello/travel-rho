"use client";

import { useEffect, useState } from "react";

export interface Quote {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export function useDolar() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  useEffect(() => {
    fetch("/api/dolar")
      .then((r) => (r.ok ? r.json() : []))
      .then(setQuotes)
      .catch(() => {});
  }, []);
  return quotes;
}

export const ars = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
