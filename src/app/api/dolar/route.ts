import { NextResponse } from "next/server";

export const revalidate = 900;

export async function GET() {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares", { next: { revalidate: 900 } });
    const rows = (await res.json()) as { casa: string; nombre: string; compra: number; venta: number; fechaActualizacion: string }[];
    const pick = ["oficial", "blue", "tarjeta", "mep"];
    return NextResponse.json(
      rows.filter((r) => pick.includes(r.casa)).sort((a, b) => pick.indexOf(a.casa) - pick.indexOf(b.casa)),
    );
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
