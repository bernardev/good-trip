import { NextRequest, NextResponse } from "next/server";
import { Viop } from "@/lib/viop";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const origemId  = p.get("origemId");
  const destinoId = p.get("destinoId");
  const data      = p.get("data"); // YYYY-MM-DD

  if (!origemId || !destinoId || !data) {
    return NextResponse.json(
      { error: "origemId, destinoId e data (YYYY-MM-DD) são obrigatórios" },
      { status: 400 }
    );
  }

  const iso = `${data}T00:00:00.000Z`;
  const corridas = await Viop.buscarCorridas(origemId, destinoId, iso);
  return NextResponse.json({ total: corridas.length, corridas }, { status: 200 });
}
