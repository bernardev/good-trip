// apps/web/src/app/api/viop/onibus-trecho/route.ts
import { NextRequest, NextResponse } from 'next/server';

const VIOP_BASE = "https://apiouroprata.rjconsultores.com.br/api-gateway";
const TENANT = "36906f34-b731-46bc-a19d-a6d8923ac2e7";
const AUTH = "Basic R09PRFRSSVBBUEk6QGcxdDIj";

// 🔥 TIPOS FORTEMENTE TIPADOS

type IsoDate = `${number}-${number}-${number}`;

interface MapaPoltrona {
  x: string;
  y: string;
  disponivel: boolean;
  numero: string;
  categoriaReservadaId: number;
}

interface ViopServico {
  servico: string;
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
  origem: { id: number; cidade: string; sigla: string; uf: string; empresas: string };
  destino: { id: number; cidade: string; sigla: string; uf: string; empresas: string };
  data: IsoDate;
  lsServicos: ViopServico[];
}

interface BuscaOnibusResp {
  origem: { id: number; cidade: string; sigla: string; uf: string; empresas: string };
  destino: { id: number; cidade: string; sigla: string; uf: string; empresas: string };
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

interface ApiResponse {
  ok: boolean;
  seats?: {
    mapaPoltrona: MapaPoltrona[];
    origem: { cidade: string; id: number };
    destino: { cidade: string; id: number };
  };
  serviceMeta?: {
    servico: string;
    preco: number | null;
    precoOriginal: number | null;
    tarifa: number | null;
    classe: string | null;
    empresa: string | null;
    empresaId: number | null;
    poltronasTotal: number | null;
    poltronasLivres: number | null;
    dataCorrida: IsoDate | null;
    saida: string | null;
    chegada: string | null;
  };
  error?: string;
}

async function viopPostJSON<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const url = `${VIOP_BASE}${path}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { 
      "content-type": "application/json",
      "x-tenant-id": TENANT,
      "authorization": AUTH,
      "user-agent": "PostmanRuntime/7.49.1"
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  
  const text = await r.text().catch(() => "");
  
  if (!r.ok) {
    throw new Error(`${path} ${r.status}: ${text.slice(0, 200)}`);
  }
  
  return (text ? JSON.parse(text) : null) as T;
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const servico = searchParams.get('servico');
    const origemId = searchParams.get('origemId');
    const destinoId = searchParams.get('destinoId');
    const data = searchParams.get('data') as IsoDate | null;

    console.log('🔍 [API Onibus Trecho] Params:', { servico, origemId, destinoId, data });

    if (!servico || !origemId || !destinoId || !data) {
      return NextResponse.json(
        { ok: false, error: 'Parâmetros obrigatórios: servico, origemId, destinoId, data' },
        { status: 400 }
      );
    }

    // 🔥 ETAPA 1: Buscar corrida para validar serviço
    console.log('📤 [API Onibus Trecho] Etapa 1: buscaCorrida');
    
    const corrida = await viopPostJSON<BuscaCorridaResp>(
      "/consultacorrida/buscaCorrida",
      { origem: parseInt(origemId, 10), destino: parseInt(destinoId, 10), data }
    );

    const svc = corrida.lsServicos?.find((s: ViopServico) => String(s.servico) === String(servico));

    if (!svc) {
      console.warn('⚠️ [API Onibus Trecho] Serviço não encontrado:', servico);
      return NextResponse.json(
        { ok: false, error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ [API Onibus Trecho] Serviço encontrado:', svc.servico);

    // 🔥 ETAPA 2: Buscar mapa de assentos
    console.log('📤 [API Onibus Trecho] Etapa 2: buscaOnibus');
    
    const mapa = await viopPostJSON<BuscaOnibusResp>(
      "/consultaonibus/buscaOnibus",
      { servico, origem: origemId, destino: destinoId, data }
    );

    console.log(`✅ [API Onibus Trecho] Encontrado ${mapa.mapaPoltrona?.length || 0} assentos`);

    // Retornar no mesmo formato que /api/viop/onibus
    return NextResponse.json({
      ok: true,
      seats: {
        mapaPoltrona: mapa.mapaPoltrona || [],
        origem: mapa.origem || { cidade: '', id: parseInt(origemId, 10) },
        destino: mapa.destino || { cidade: '', id: parseInt(destinoId, 10) },
      },
      serviceMeta: {
        servico: String(servico),
        preco: svc.preco ?? null,
        precoOriginal: svc.precoOriginal ?? null,
        tarifa: svc.tarifa ?? null,
        classe: svc.classe ?? null,
        empresa: svc.empresa ?? null,
        empresaId: svc.empresaId ?? null,
        poltronasTotal: svc.poltronasTotal ?? mapa.mapaPoltrona?.length ?? null,
        poltronasLivres: svc.poltronasLivres ?? mapa.poltronasLivres ?? null,
        dataCorrida: (svc.dataCorrida ?? mapa.data) as IsoDate | null,
        saida: svc.saida ?? mapa.dataSaida ?? null,
        chegada: svc.chegada ?? mapa.dataChegada ?? null,
      },
    });

  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ [API Onibus Trecho] Erro:', mensagem);
    
    return NextResponse.json(
      { ok: false, error: mensagem },
      { status: 500 }
    );
  }
}