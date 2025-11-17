// apps/web/src/app/api/viop/destinos/route.ts
import { NextResponse } from "next/server";
import { Viop, type Destino } from "@/lib/viop";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const origemId = searchParams.get("origemId") ?? "";
    const q = searchParams.get("q") ?? "";
    if (!origemId) {
      return NextResponse.json({ ok: false, error: "origemId obrigatório" }, { status: 400 });
    }
    const items: Destino[] = await Viop.buscarDestinos(origemId, q);
    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
