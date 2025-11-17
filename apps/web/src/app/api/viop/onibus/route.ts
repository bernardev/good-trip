// app/api/viop/onibus/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE   = process.env.VIOP_BASE_URL!;
const TENANT = process.env.VIOP_TENANT_ID!;
const USER   = process.env.VIOP_USER!;
const PASS   = process.env.VIOP_PASS!;
const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

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

async function viopPostJSON<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-tenant-id": TENANT, authorization: AUTH },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await r.text().catch(()=>"");
  if (!r.ok) throw new Error(`${path} ${r.status}: ${text.slice(0,200)}`);
  return (text ? JSON.parse(text) : null) as T;
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const origemId  = p.get("origemId");
  const destinoId = p.get("destinoId");
  const data      = p.get("data") as IsoDate | null;
  const servico   = p.get("servico"); // ex.: "20531"

  if (!origemId || !destinoId || !data || !servico) {
    return NextResponse.json(
      { ok:false, error: "origemId, destinoId, data, servico são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    // 1) Enriquecer com preço/infos do serviço da corrida
    const corrida = await viopPostJSON<BuscaCorridaResp>("/consultacorrida/buscaCorrida", {
      origem: origemId, destino: destinoId, data
    });
    const svc = corrida.lsServicos.find(s => String(s.servico) === String(servico));
    if (!svc) {
      return NextResponse.json(
        { ok:false, error: "Serviço não encontrado em lsServicos para esta data/rota." },
        { status: 404 }
      );
    }

    // 2) Mapa de assentos (payload validado em testes)
    const body = { servico, origem: origemId, destino: destinoId, data };
    const mapa = await viopPostJSON<BuscaOnibusResp>("/consultaonibus/buscaOnibus", body);

    // 3) Resposta unificada (sem any)
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
      seats: mapa, // JSON original do buscaOnibus
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return NextResponse.json({ ok:false, error: msg }, { status: 502 });
  }
}
