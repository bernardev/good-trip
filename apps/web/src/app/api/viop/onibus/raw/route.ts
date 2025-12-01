import { NextRequest, NextResponse } from "next/server";

// ===== SEM .env → tudo direto no arquivo =====
const PROXY = "https://goodtrip.com.br/proxy-viop.php"; // PHP no public_html

const BASE   = `${PROXY}?path=`;            // endpoint base via proxy
const TENANT = "36906f34-b731-4c28-954e-3c514152de9f";
const USER   = "GOODTRIPAPI";
const PASS   = "@g1t2#";
const AUTH   = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

// ===== Tipos mínimos =====
type RjServicoMinimal = {
  idServico?: string | number;
  idViagem?: string | number;
  codigo?: string | number;
  codigoServico?: string | number;
  empresa?: string;
  operadora?: string;
  companhia?: string;
  servico?: string;
  tipo?: string;
};

type RjBuscaCorridaEnvelope = {
  origem: unknown;
  destino: unknown;
  data: string;
  lsServicos: RjServicoMinimal[];
};

// ===== Utils =====
function isObject(u: unknown): u is Record<string, unknown> {
  return typeof u === "object" && u !== null;
}
function isServicoMinimal(u: unknown): u is RjServicoMinimal {
  return isObject(u);
}
function parseCorridaEnvelope(u: unknown): RjBuscaCorridaEnvelope | null {
  if (!isObject(u)) return null;
  const ls = u["lsServicos"];
  if (!Array.isArray(ls)) return null;
  const list: RjServicoMinimal[] = ls.filter(isServicoMinimal);
  const data = typeof u["data"] === "string" ? u["data"] : "";
  return { origem: u["origem"], destino: u["destino"], data, lsServicos: list };
}

function pickNonEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

const toIso = (ymd: string) => `${ymd}T00:00:00.000Z`;

// ===== Handler =====
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const origemId = Number(p.get("origemId"));
  const destinoId = Number(p.get("destinoId"));
  const dateYmd = p.get("data") ?? "";
  const index = Number(p.get("index") ?? 0);

  if (!origemId || !destinoId || !dateYmd) {
    return NextResponse.json(
      { error: "origemId, destinoId e data (YYYY-MM-DD) são obrigatórios." },
      { status: 400 }
    );
  }

  // 1) Buscar corridas
  const corrRes = await fetch(`${BASE}/consultacorrida/buscaCorrida`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant-id": TENANT,
      authorization: AUTH,
    },
    body: JSON.stringify({ origem: origemId, destino: destinoId, data: dateYmd }),
    cache: "no-store",
  });

  const corrText = await corrRes.text().catch(() => "");
  if (!corrRes.ok) {
    return NextResponse.json(
      { step: "corridas", status: corrRes.status, sample: corrText.slice(0, 600) },
      { status: 502 }
    );
  }

  let corrJson: unknown = {};
  try { corrJson = corrText ? JSON.parse(corrText) : {}; } catch {}

  const env = parseCorridaEnvelope(corrJson);
  if (!env || env.lsServicos.length === 0) {
    return NextResponse.json(
      { ok: false, reason: "lsServicos vazio", envelope: env ?? null },
      { status: 200 }
    );
  }

  const svc = env.lsServicos[Math.max(0, Math.min(index, env.lsServicos.length - 1))];

  // 2) Candidatos para buscaOnibus
  const empresa =
    svc.empresa ||
    svc.operadora ||
    svc.companhia ||
    "VOP";

  const candidates: ReadonlyArray<Record<string, unknown>> = [
    { idServico: svc.idServico },
    { idViagem: svc.idViagem },
    { codigo: svc.codigo },
    { codigoServico: svc.codigoServico },
    { origem: origemId, destino: destinoId, data: dateYmd, empresa },
    {
      idLocalidadeOrigem: origemId,
      idLocalidadeDestino: destinoId,
      data: dateYmd,
      servico: svc.servico ?? svc.tipo ?? "CONV",
    },
    { origem: origemId, destino: destinoId, data: toIso(dateYmd), empresa },
  ]
    .map(pickNonEmpty)
    .filter((o) => Object.keys(o).length > 0);

  // 3) Executar tentativas
  for (const body of candidates) {
    const r = await fetch(`${BASE}/consultaonibus/buscaOnibus`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": TENANT,
        authorization: AUTH,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await r.text().catch(() => "");
    if (r.ok) {
      let json: unknown = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = text; }

      return NextResponse.json(
        { usedBody: body, status: r.status, json, sample: text.slice(0, 600) },
        { status: 200 }
      );
    }
  }

  return NextResponse.json(
    { ok: false, reason: "nenhum payload aceito", tried: candidates },
    { status: 200 }
  );
}
