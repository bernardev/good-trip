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
    // IDs originais da busca completa (ex: Altamira→Santa Inês), usados como fallback
    const fullOrigemId = searchParams.get('fullOrigemId');
    const fullDestinoId = searchParams.get('fullDestinoId');

    console.log('🔍 [API Onibus Trecho] Params:', { servico, origemId, destinoId, data, fullOrigemId, fullDestinoId });

    if (!servico || !origemId || !destinoId || !data) {
      return NextResponse.json(
        { ok: false, error: 'Parâmetros obrigatórios: servico, origemId, destinoId, data' },
        { status: 400 }
      );
    }

    // 🔥 ETAPA 1: Buscar corrida para obter metadata do serviço (opcional para conexões)
    console.log('📤 [API Onibus Trecho] Etapa 1: buscaCorrida');

    let svc: ViopServico | undefined;
    try {
      const corrida = await viopPostJSON<BuscaCorridaResp>(
        "/consultacorrida/buscaCorrida",
        { origem: parseInt(origemId, 10), destino: parseInt(destinoId, 10), data }
      );
      svc = corrida.lsServicos?.find((s: ViopServico) => String(s.servico) === String(servico));

      if (svc) {
        console.log('✅ [API Onibus Trecho] Serviço encontrado via buscaCorrida:', svc.servico);
      } else {
        console.log('⚠️ [API Onibus Trecho] Serviço não encontrado em buscaCorrida (pode ser trecho de conexão):', servico);
      }
    } catch (e) {
      console.warn('⚠️ [API Onibus Trecho] buscaCorrida falhou, tentando buscaOnibus direto:', e instanceof Error ? e.message : e);
    }

    // 🔥 ETAPA 2: Buscar mapa de assentos — tentar com IDs do trecho primeiro
    console.log('📤 [API Onibus Trecho] Etapa 2: buscaOnibus com IDs do trecho');

    let mapa: BuscaOnibusResp | null = null;

    try {
      mapa = await viopPostJSON<BuscaOnibusResp>(
        "/consultaonibus/buscaOnibus",
        { servico, origem: origemId, destino: destinoId, data }
      );
    } catch (e) {
      console.warn('⚠️ [API Onibus Trecho] buscaOnibus com IDs do trecho falhou:', e instanceof Error ? e.message : e);
    }

    // 🔥 ETAPA 2b: Se não retornou assentos e temos IDs originais, tentar com eles (fallback para conexões)
    if ((!mapa?.mapaPoltrona || mapa.mapaPoltrona.length === 0) && fullOrigemId && fullDestinoId) {
      console.log('📤 [API Onibus Trecho] Etapa 2b: buscaOnibus com IDs originais da busca:', { fullOrigemId, fullDestinoId });

      // Também buscar metadata via buscaCorrida com IDs completos
      if (!svc) {
        try {
          const corridaFull = await viopPostJSON<BuscaCorridaResp>(
            "/consultacorrida/buscaCorrida",
            { origem: parseInt(fullOrigemId, 10), destino: parseInt(fullDestinoId, 10), data }
          );
          // Buscar o serviço dentro de conexões
          for (const s of (corridaFull.lsServicos || [])) {
            if (String(s.servico) === String(servico)) {
              svc = s;
              console.log('✅ [API Onibus Trecho] Serviço encontrado via buscaCorrida full:', svc.servico);
              break;
            }
          }
        } catch (e) {
          console.warn('⚠️ [API Onibus Trecho] buscaCorrida full falhou:', e instanceof Error ? e.message : e);
        }
      }

      try {
        mapa = await viopPostJSON<BuscaOnibusResp>(
          "/consultaonibus/buscaOnibus",
          { servico, origem: fullOrigemId, destino: fullDestinoId, data }
        );
      } catch (e) {
        console.warn('⚠️ [API Onibus Trecho] buscaOnibus com IDs originais também falhou:', e instanceof Error ? e.message : e);
      }
    }

    if (!mapa?.mapaPoltrona || mapa.mapaPoltrona.length === 0) {
      console.warn('⚠️ [API Onibus Trecho] Nenhum assento encontrado para servico:', servico);
      return NextResponse.json(
        { ok: false, error: 'Nenhum assento disponível para este trecho' },
        { status: 404 }
      );
    }

    console.log(`✅ [API Onibus Trecho] Encontrado ${mapa.mapaPoltrona.length} assentos`);

    // Retornar no mesmo formato que /api/viop/onibus
    return NextResponse.json({
      ok: true,
      seats: {
        mapaPoltrona: mapa.mapaPoltrona,
        origem: mapa.origem || { cidade: '', id: parseInt(origemId, 10) },
        destino: mapa.destino || { cidade: '', id: parseInt(destinoId, 10) },
      },
      serviceMeta: {
        servico: String(servico),
        preco: svc?.preco ?? null,
        precoOriginal: svc?.precoOriginal ?? null,
        tarifa: svc?.tarifa ?? null,
        classe: svc?.classe ?? mapa.classeServico ?? null,
        empresa: svc?.empresa ?? null,
        empresaId: svc?.empresaId ?? mapa.empresaCorridaId ?? null,
        poltronasTotal: svc?.poltronasTotal ?? mapa.mapaPoltrona.length ?? null,
        poltronasLivres: svc?.poltronasLivres ?? mapa.poltronasLivres ?? null,
        dataCorrida: (svc?.dataCorrida ?? mapa.dataCorrida ?? mapa.data) as IsoDate | null,
        saida: svc?.saida ?? mapa.dataSaida ?? null,
        chegada: svc?.chegada ?? mapa.dataChegada ?? null,
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