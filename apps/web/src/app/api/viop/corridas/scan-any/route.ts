import { NextRequest, NextResponse } from "next/server";
import { Viop, Origem, Destino, Corrida } from "@/lib/viop";

type PerTry = { origem: Origem; destino: Destino; date: string; total: number };

type ScanAnyFound = {
  found: true;
  checked: number;
  tried: PerTry[];
  origem: Origem;
  destino: Destino;
  date: string;            // YYYY-MM-DD
  totalOnDate: number;
  corridas: Corrida[];
};

type ScanAnyNotFound = {
  found: false;
  checked: number;
  tried: PerTry[];
};

function addDaysUTC(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  const start = p.get("start");                 // YYYY-MM-DD (obrigatório)
  const days  = Math.max(1, Math.min(60, Number(p.get("days") ?? "21")));

  const originQuery = p.get("originQuery") ?? "";   // filtro opcional p/ origens (por nome/UF)
  const maxOrigins  = Math.max(1, Math.min(100, Number(p.get("maxOrigins") ?? "25")));
  const maxDestinos = Math.max(1, Math.min(100, Number(p.get("maxDestinos") ?? "25")));

  if (!start) {
    return NextResponse.json(
      { error: "Parâmetro obrigatório: start (YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  // 1) Carrega um lote de origens (opcionalmente filtradas por texto)
  const allOrigens = await Viop.buscarOrigens(originQuery);
  const origens = allOrigens.slice(0, maxOrigins);

  const tried: PerTry[] = [];
  let checks = 0;

  for (const origem of origens) {
    // 2) Carrega destinos dessa origem
    const destinosAll = await Viop.buscarDestinos(origem.id, "");
    const destinos = destinosAll.slice(0, maxDestinos);

    for (const destino of destinos) {
      for (let i = 0; i < days; i++) {
        const dateYmd = addDaysUTC(start, i);
        const iso = `${dateYmd}T00:00:00.000Z`;

        const corridas = await Viop.buscarCorridas(origem.id, destino.id, iso);
        const total = corridas.length;

        tried.push({ origem, destino, date: dateYmd, total });
        checks++;

        if (total > 0) {
          const payload: ScanAnyFound = {
            found: true,
            checked: checks,
            tried,
            origem,
            destino,
            date: dateYmd,
            totalOnDate: total,
            corridas,
          };
          return NextResponse.json(payload, { status: 200 });
        }
      }
    }
  }

  const notFound: ScanAnyNotFound = { found: false, checked: checks, tried };
  return NextResponse.json(notFound, { status: 200 });
}
