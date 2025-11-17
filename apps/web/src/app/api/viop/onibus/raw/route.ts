import { NextRequest, NextResponse } from "next/server";

const BASE   = process.env.VIOP_BASE_URL!;
const TENANT = process.env.VIOP_TENANT_ID!;
const USER   = process.env.VIOP_USER!;
const PASS   = process.env.VIOP_PASS!;
const AUTH   = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

// ===== Tipos mínimos para leitura segura =====
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

// ===== Utils/guards =====
function isObject(u: unknown): u is Record<string, unknown> {
  return typeof u === "object" && u !== null;
}
function isServicoMinimal(u: unknown): u is RjServicoMinimal {
  if (!isObject(u)) return false;
  // basta ser objeto; campos são opcionais e validados na extração
  return true;
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
  const origemIdStr = p.get("origemId");
  const destinoIdStr = p.get("destinoId");
  const dateYmd = p.get("data") ?? "";
  const indexStr = p.get("index") ?? "0";

  const origemId = origemIdStr ? Number(origemIdStr) : NaN;
  const destinoId = destinoIdStr ? Number(destinoIdStr) : NaN;
  const index = Number(indexStr);

  if (!Number.isFinite(origemId) || !Number.isFinite(destinoId) || !dateYmd) {
    return NextResponse.json(
      { error: "origemId, destinoId e data (YYYY-MM-DD) são obrigatórios." },
      { status: 400 }
    );
  }

  // 1) Buscar serviços para obter campos do serviço selecionado
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
  try { corrJson = corrText ? JSON.parse(corrText) : {}; } catch { corrJson = {}; }

  const env = parseCorridaEnvelope(corrJson);
  if (!env || env.lsServicos.length === 0) {
    return NextResponse.json(
      { ok: false, reason: "lsServicos vazio", envelope: env ?? null },
      { status: 200 }
    );
  }

  const svc = env.lsServicos[Math.max(0, Math.min(index, env.lsServicos.length - 1))];

  // 2) Montar candidatos de payload para /consultaonibus/buscaOnibus
  const empresa =
    (typeof svc.empresa === "string" && svc.empresa) ||
    (typeof svc.operadora === "string" && svc.operadora) ||
    (typeof svc.companhia === "string" && svc.companhia) ||
    "VOP";

  const candidates: ReadonlyArray<Record<string, unknown>> = [
    { idServico: svc.idServico },
    { idViagem: svc.idViagem },
    { codigo: svc.codigo },
    { codigoServico: svc.codigoServico },
    { origem: origemId, destino: destinoId, data: dateYmd, empresa },
    { idLocalidadeOrigem: origemId, idLocalidadeDestino: destinoId, data: dateYmd, servico: svc.servico ?? svc.tipo ?? "CONV" },
    { origem: origemId, destino: destinoId, data: toIso(dateYmd), empresa },
  ].map(pickNonEmpty).filter((o) => Object.keys(o).length > 0);

  // 3) Tentar cada payload até um 200 OK
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
