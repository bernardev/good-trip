import { NextRequest, NextResponse } from "next/server";

/** ====== PROXY ====== */
const PROXY = "https://goodtrip.com.br/proxy-viop.php";

/** ====== TIPOS ====== */
type IsoDate = `${number}-${number}-${number}`;
type YmdDateTime = `${IsoDate} ${string}`;

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
  [k: string]: unknown;
}

interface ViopBuscaCorridaResp {
  origem?: unknown;
  destino?: unknown;
  data?: IsoDate;
  lsServicos: ViopServico[];
}

interface TryResult {
  ok: boolean;
  status: number;
  usedBody: Record<string, unknown>;
  json: unknown;
  sample: string;
}

/** ====== HELPERS ====== */
async function proxyPost(path: string, body: Record<string, unknown>) {
  const url = `${PROXY}?path=${encodeURIComponent(path)}`;

  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await r.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch {}

  return { ok: r.ok, status: r.status, text, json };
}

async function buscarServico(
  origemId: number,
  destinoId: number,
  data: IsoDate,
  index: number
): Promise<ViopServico> {
  const body = { origem: String(origemId), destino: String(destinoId), data };

  const r = await proxyPost("/consultacorrida/buscaCorrida", body);

  if (!r.ok) throw new Error(`/consultacorrida/buscaCorrida ${r.status}: ${r.text}`);

  const resp = r.json as ViopBuscaCorridaResp;

  const svc = resp.lsServicos?.[index];
  if (!svc) {
    throw new Error(`lsServicos vazio ou índice ${index} inexistente`);
  }

  return svc;
}

async function tentaBuscaOnibus(
  payload: Record<string, unknown>
): Promise<TryResult> {
  const r = await proxyPost("/consultaonibus/buscaOnibus", payload);

  return {
    ok: r.ok,
    status: r.status,
    usedBody: payload,
    json: r.json,
    sample: r.text.slice(0, 1000),
  };
}

function montarCandidatos(
  svc: ViopServico,
  origemId: number,
  destinoId: number,
  data: IsoDate
): ReadonlyArray<Record<string, unknown>> {
  const candidatos: Array<Record<string, unknown>> = [];

  // identificador + rota
  if (svc.identificadorViagem) {
    candidatos.push({
      identificadorViagem: svc.identificadorViagem,
      idLocalidadeOrigem: origemId,
      idLocalidadeDestino: destinoId,
    });

    candidatos.push({
      identificadorViagem: svc.identificadorViagem,
      origem: String(origemId),
      destino: String(destinoId),
    });

    candidatos.push({
      identificadorViagem: svc.identificadorViagem,
      idLocalidadeOrigem: origemId,
      idLocalidadeDestino: destinoId,
      data,
    });

    if (svc.dataCorrida) {
      candidatos.push({
        identificadorViagem: svc.identificadorViagem,
        idLocalidadeOrigem: origemId,
        idLocalidadeDestino: destinoId,
        data: svc.dataCorrida,
      });
    }
  }

  // servico + rota
  if (svc.servico) {
    candidatos.push({
      servico: svc.servico,
      idLocalidadeOrigem: origemId,
      idLocalidadeDestino: destinoId,
      data,
    });

    if (svc.dataCorrida) {
      candidatos.push({
        servico: svc.servico,
        origem: String(origemId),
        destino: String(destinoId),
        data: svc.dataCorrida,
      });
    }
  }

  // fallback
  if (svc.identificadorViagem) candidatos.push({ identificadorViagem: svc.identificadorViagem });
  if (svc.servico)
    candidatos.push({
      codigoServico: svc.servico,
      data,
      origem: String(origemId),
      destino: String(destinoId),
    });

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
          note: "Primeiro payload aceito pela VIOP",
        });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        serviceUsed: svc,
        tried: attempts,
        note: "Nenhuma variante foi aceita pela API",
      },
      { status: 422 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
