import { NextRequest, NextResponse } from "next/server";

const BASE   = process.env.VIOP_BASE_URL!;
const TENANT = process.env.VIOP_TENANT_ID!;
const USER   = process.env.VIOP_USER!;
const PASS   = process.env.VIOP_PASS!;
const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const origemId  = Number(p.get("origemId"));
  const destinoId = Number(p.get("destinoId"));
  const data      = p.get("data")!; // YYYY-MM-DD

  if (!origemId || !destinoId || !data) {
    return NextResponse.json({ error: "origemId, destinoId, data são obrigatórios" }, { status: 400 });
  }

  const candidates: Record<string, unknown>[] = [
    { idLocalidadeOrigem: origemId, idLocalidadeDestino: destinoId, data },
    { idLocalidadeOrigem: origemId, idLocalidadeDestino: destinoId, dataViagem: data },
    { origemId, destinoId, data },
    { origem: origemId, destino: destinoId, data },
    { idLocalidadeOrigem: origemId, idLocalidadeDestino: destinoId, data, servico: "CONV" },
    { idLocalidadeOrigem: origemId, idLocalidadeDestino: destinoId, data, servicoId: 1 },
  ];

  for (const body of candidates) {
    const r = await fetch(`${BASE}/consultacorrida/buscaCorrida`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": TENANT,
        authorization: AUTH,
      },
      body: JSON.stringify(body),
    });

    const text = await r.text().catch(()=> "");
    if (r.ok) {
      let json: unknown = null;
      try { json = text ? JSON.parse(text) : null; } catch {}
      return NextResponse.json({ usedBody: body, status: r.status, json, sample: text.slice(0, 500) }, { status: 200 });
    }
  }

  return NextResponse.json({ error: "Nenhum formato aceito" }, { status: 422 });
}
