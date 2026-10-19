"use client";

import { useEffect, useState } from "react";
import { TZ } from "@/lib/time";

export interface DayWeather {
  max: number;
  min: number;
  rain: number;
  code: number;
}

// Códigos WMO de Open-Meteo, agrupados en palabras simples.
export function describe(code: number) {
  if (code === 0) return "Despejado";
  if (code <= 2) return "Algo nublado";
  if (code === 3) return "Nublado";
  if (code <= 48) return "Niebla";
  if (code <= 57) return "Llovizna";
  if (code <= 67) return "Lluvia";
  if (code <= 77) return "Nieve";
  if (code <= 82) return "Chaparrones";
  return "Tormenta";
}

export function useWeather(lat?: number, lng?: number) {
  const [days, setDays] = useState<Record<string, DayWeather>>({});
  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
      `&timezone=${encodeURIComponent(TZ)}&forecast_days=16`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        const out: Record<string, DayWeather> = {};
        d.daily?.time?.forEach((t: string, i: number) => {
          out[t] = {
            max: Math.round(d.daily.temperature_2m_max[i]),
            min: Math.round(d.daily.temperature_2m_min[i]),
            rain: d.daily.precipitation_probability_max[i] ?? 0,
            code: d.daily.weather_code[i],
          };
        });
        setDays(out);
      })
      .catch(() => {});
  }, [lat, lng]);
  return days;
}
