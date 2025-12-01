// app/api/viop/onibus/route.ts
import { NextRequest, NextResponse } from "next/server";

// --- SEU PROXY FIXO ---
const PROXY = "https://goodtrip.com.br/proxy-viop.php";

// Função para POST via proxy
async function viopPostJSON<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const url = `${PROXY}?path=${encodeURIComponent(path)}`;

  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await r.text().catch(() => "");

  if (!r.ok)
    throw new Error(`${path} ${r.status}: ${text.slice(0, 200)}`);

  return (text ? JSON.parse(text) : null) as T;
}

// Tipos originais (inalterados)
type IsoDate = `${number}-${number}-${number}`;

interface MapaPoltrona {
  x: string; y: string; disponivel: boolean; numero: string; categoriaReservadaId: number;
}
interface BuscaOnibusResp {
  origem: { id: number; cidade: string; sigla: string; uf: string; empresas: string };
  destino:{ id: number; cidade: string; sigla: string; uf: string; empresas: string };
  data: IsoDate;
  servico: string;
  dataSaida: string;
  dataChegada: string;
  linha: string;
  mapaPoltrona: MapaPoltrona[];
  poltronasLivres: number;
  empresaCorridaId: number;
  classeServico: string;
  dataCorrida: IsoDate;
  pricingAplicado: string;
  orgaoConcedenteId: number;
  linhaAlias: string;
  claseServicio_id: number;
}

interface ViopServico {
  servico?: string;
  identificadorViagem?: string;
  preco?: number;
  precoOriginal?: number;
  poltronasLivres?: number;
  poltronasTotal?: number;
  classe?: string;
  empresa?: string;
  empresaId?: number;
  tarifa?: number;
  dataCorrida?: IsoDate;
  saida?: string;
  chegada?: string;
  [k: string]: unknown;
}

interface BuscaCorridaResp {
  lsServicos: ViopServico[];
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  const origemId  = p.get("origemId");
  const destinoId = p.get("destinoId");
  const data      = p.get("data") as IsoDate | null;
  const servico   = p.get("servico");

  if (!origemId || !destinoId || !data || !servico) {
    return NextResponse.json(
      { ok: false, error: "origemId, destinoId, data, servico são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    // 1 — Buscar lista de serviços
    const corrida = await viopPostJSON<BuscaCorridaResp>(
      "/consultacorrida/buscaCorrida",
      { origem: origemId, destino: destinoId, data }
    );

    const svc = corrida.lsServicos.find(
      s => String(s.servico) === String(servico)
    );

    if (!svc) {
      return NextResponse.json(
        { ok: false, error: "Serviço não encontrado em lsServicos." },
        { status: 404 }
      );
    }

    // 2 — Buscar mapa de assentos
    const body = { servico, origem: origemId, destino: destinoId, data };

    const mapa = await viopPostJSON<BuscaOnibusResp>(
      "/consultaonibus/buscaOnibus",
      body
    );

    // 3 — Resposta unificada
    return NextResponse.json({
      ok: true,
      usedBody: body,
      serviceMeta: {
        servico: String(servico),
        preco: svc.preco ?? null,
        precoOriginal: svc.precoOriginal ?? null,
        tarifa: svc.tarifa ?? null,
        classe: svc.classe ?? null,
        empresa: svc.empresa ?? null,
        empresaId: svc.empresaId ?? null,
        poltronasTotal: svc.poltronasTotal ?? mapa.mapaPoltrona.length ?? null,
        poltronasLivres: svc.poltronasLivres ?? mapa.poltronasLivres ?? null,
        dataCorrida: (svc.dataCorrida ?? mapa.data) as IsoDate,
        saida: svc.saida ?? mapa.dataSaida,
        chegada: svc.chegada ?? mapa.dataChegada,
      },
      seats: mapa,
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
