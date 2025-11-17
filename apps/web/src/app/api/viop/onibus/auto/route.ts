import { NextRequest, NextResponse } from "next/server";

/** ====== ENV / AUTH ====== */
const BASE   = process.env.VIOP_BASE_URL!;
const TENANT = process.env.VIOP_TENANT_ID!;
const USER   = process.env.VIOP_USER!;
const PASS   = process.env.VIOP_PASS!;
const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

/** ====== TIPOS ====== */
type IsoDate = `${number}-${number}-${number}`;
type YmdDateTime = `${IsoDate} ${string}`;

/** Objeto de serviço retornado em lsServicos (campos conhecidos, restantes opcionais). */
export interface ViopServico {
  identificadorViagem?: string;
  servico?: string;
  empresa?: string;
  empresaId?: number;
  saida?: YmdDateTime;
  chegada?: YmdDateTime;
  dataCorrida?: IsoDate;
  data?: IsoDate;
  poltronasLivres?: number;
  poltronasTotal?: number;
  preco?: number;
  [k: string]: unknown; // mantém extensível sem usar `any`
}

/** Resposta mínima de buscaCorrida usada aqui. */
interface ViopBuscaCorridaResp {
  origem?: unknown;
  destino?: unknown;
  data?: IsoDate;
  lsServicos: ViopServico[];
}

/** Resultado de uma tentativa no buscaOnibus. */
interface TryResult {
  ok: boolean;
  status: number;
  usedBody: Record<string, unknown>;
  json: unknown;
  sample: string;
}

/** ====== HELPERS ====== */
async function viopFetchJSON<TResp>(
  path: string,
  body: Record<string, unknown>
): Promise<TResp> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant-id": TENANT,
      authorization: AUTH,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`${path} ${r.status}: ${text.slice(0, 200)}`);
  }
  return (await r.json()) as TResp;
}

async function tentaBuscaOnibus(payload: Record<string, unknown>): Promise<TryResult> {
  const r = await fetch(`${BASE}/consultaonibus/buscaOnibus`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant-id": TENANT,
      authorization: AUTH,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await r.text().catch(() => "");
  let parsed: unknown = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* mantém como string no sample */ }

  return {
    ok: r.ok,
    status: r.status,
    usedBody: payload,
    json: parsed,
    sample: text.slice(0, 1000),
  };
}

/** ====== CORE ====== */
async function buscarServico(
  origemId: number,
  destinoId: number,
  data: IsoDate,
  index: number
): Promise<ViopServico> {
  // A API aceita **strings** para origem/destino
  const body = { origem: String(origemId), destino: String(destinoId), data };
  const resp = await viopFetchJSON<ViopBuscaCorridaResp>("/consultacorrida/buscaCorrida", body);

  const svc = resp.lsServicos?.[index];
  if (!svc) {
    throw new Error(`lsServicos vazio ou índice ${index} inexistente`);
  }
  return svc;
}

function montarCandidatos(
  svc: ViopServico,
  origemId: number,
  destinoId: number,
  data: IsoDate
): ReadonlyArray<Record<string, unknown>> {
  const candidatos: Array<Record<string, unknown>> = [];

  // 1) identificador + rota (mais provável)
  if (svc.identificadorViagem) {
    candidatos.push({ identificadorViagem: svc.identificadorViagem, idLocalidadeOrigem: origemId, idLocalidadeDestino: destinoId });
    candidatos.push({ identificadorViagem: svc.identificadorViagem, origem: String(origemId), destino: String(destinoId) });
    candidatos.push({ identificadorViagem: svc.identificadorViagem, idLocalidadeOrigem: origemId, idLocalidadeDestino: destinoId, data });
    if (svc.dataCorrida) {
      candidatos.push({ identificadorViagem: svc.identificadorViagem, idLocalidadeOrigem: origemId, idLocalidadeDestino: destinoId, data: svc.dataCorrida });
    }
  }

  // 2) código do serviço + rota + data
  if (svc.servico) {
    candidatos.push({ servico: svc.servico, idLocalidadeOrigem: origemId, idLocalidadeDestino: destinoId, data });
    if (svc.dataCorrida) {
      candidatos.push({ servico: svc.servico, origem: String(origemId), destino: String(destinoId), data: svc.dataCorrida });
    }
  }

  // 3) fallback minimalistas
  if (svc.identificadorViagem) candidatos.push({ identificadorViagem: svc.identificadorViagem });
  if (svc.servico) candidatos.push({ codigoServico: svc.servico, data, origem: String(origemId), destino: String(destinoId) });

  return candidatos;
}


/** ====== HANDLER ====== */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const origemId = Number(p.get("origemId"));
  const destinoId = Number(p.get("destinoId"));
  const data = p.get("data") as IsoDate | null;
  const index = Number(p.get("index") ?? 0);

  if (!origemId || !destinoId || !data) {
    return NextResponse.json(
      { ok: false, error: "origemId, destinoId, data são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    const svc = await buscarServico(origemId, destinoId, data, index);
    const candidatos = montarCandidatos(svc, origemId, destinoId, data);

    const attempts: TryResult[] = [];
    for (const body of candidatos) {
      const res = await tentaBuscaOnibus(body);
      attempts.push(res);
      if (res.ok) {
        return NextResponse.json({
          ok: true,
          serviceUsed: svc,
          accepted: res,
          tried: attempts,
          note: "Primeiro payload aceito para consulta de assentos.",
        });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        serviceUsed: svc,
        tried: attempts,
        note:
          "Nenhum payload foi aceito pelo consultaonibus/buscaOnibus. " +
          "Verifique qual identificador a API espera (ex.: identificadorViagem ou idViagem).",
      },
      { status: 422 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
