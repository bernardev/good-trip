// ============================================
// 1. ROUTE HANDLER - /api/buscar-unificado
// ============================================
// apps/web/src/app/api/buscar-unificado/route.ts

import { NextRequest, NextResponse } from 'next/server';

// ---------- Tipos base ----------
type ISODate = `${number}-${number}-${number}`; // 'YYYY-MM-DD' (não valida calendário)
type HHMM = `${number}:${number}`;              // 'HH:MM'

// ---------- Entrada ----------
export type SearchParams = {
  origem: string;
  destino: string;
  data: ISODate;
  passageiros?: number;
};

// ---------- Saída unificada ----------
export type ViagemUnificada = {
  id: string;
  provider: 'ouro-prata' | 'distribusion';
  origem: string;
  destino: string;
  dataPartida: ISODate;
  horarioPartida: HHMM | '--:--';
  horarioChegada: HHMM | '--:--';
  duracao: string;
  preco: number;
  assentosDisponiveis: number;
  tipo: string;
  nomeEmpresa: string;
  dadosReserva?: ViopTrip;  // Para Ouro e Prata
  urlDistribusion?: string; // Para Distribusion
};

// ---------- Ouro e Prata (VIOP) ----------
type ViopTrip = {
  id: string;
  horarioSaida: HHMM;
  horarioChegada: HHMM;
  preco: number;
  assentosDisponiveis?: number;
  tipoOnibus?: string;
  [k: string]: unknown; // permite campos extras sem virar any
};

type ViopBuscarResponse = {
  viagens?: ViopTrip[];
  [k: string]: unknown;
};

// ---------- Distribusion (API oficial) ----------
type DistribusionConnection = {
  id: string;
  attributes: {
    departure_time: HHMM;
    arrival_time: HHMM;
    duration: number; // minutos
    cheapest_total_adult_price?: number;
    travel_class?: string;
    marketing_carrier_name?: string;
  };
};

type DistribusionFindResponse = {
  data?: DistribusionConnection[];
  [k: string]: unknown;
};

// ---------- Respostas HTTP ----------
type OkResponse = { ok: true; total: number; viagens: ViagemUnificada[] };
type ErrResponse = { error: string };

// ============================================
// HANDLER
// ============================================
export async function GET(
  request: NextRequest
): Promise<NextResponse<OkResponse | ErrResponse>> {
  const sp = request.nextUrl.searchParams;

  const passageirosRaw = sp.get('passageiros');
  const parsedPassageiros = Number(passageirosRaw ?? '1');
  const passageiros =
    Number.isFinite(parsedPassageiros) && parsedPassageiros > 0
      ? Math.floor(parsedPassageiros)
      : 1;

  const params: SearchParams = {
    origem: (sp.get('origem') ?? '') as string,
    destino: (sp.get('destino') ?? '') as string,
    data: (sp.get('data') ?? '') as ISODate,
    passageiros,
  };

  if (!params.origem || !params.destino || !params.data) {
    return NextResponse.json<ErrResponse>(
      { error: 'Parâmetros inválidos' },
      { status: 400 }
    );
  }

  try {
    const settled: [
      PromiseSettledResult<ViagemUnificada[]>,
      PromiseSettledResult<ViagemUnificada[]>
    ] = await Promise.allSettled([
      buscarOuroPrata(params),
      gerarResultadosDistribusion(params),
    ] as const);

    const [opRes, distRes] = settled;

    const resultados: ViagemUnificada[] = [];
    if (opRes.status === 'fulfilled') resultados.push(...opRes.value);
    if (distRes.status === 'fulfilled') resultados.push(...distRes.value);

    resultados.sort((a, b) => a.preco - b.preco);

    return NextResponse.json<OkResponse>({
      ok: true,
      total: resultados.length,
      viagens: resultados,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro na busca unificada:', error);
    return NextResponse.json<ErrResponse>(
      { error: 'Erro ao buscar viagens' },
      { status: 500 }
    );
  }
}

// ============================================
// BUSCAR OURO E PRATA (sua API existente)
// ============================================
async function buscarOuroPrata(params: SearchParams): Promise<ViagemUnificada[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) throw new Error('NEXT_PUBLIC_API_URL não configurada');

    const url = new URL('/api/viop/buscar', baseUrl);
    url.searchParams.set('origem', params.origem);
    url.searchParams.set('destino', params.destino);
    url.searchParams.set('data', params.data);

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar Ouro e Prata: ${response.status}`);
    }

    const data = (await response.json()) as ViopBuscarResponse;
    const viagens = Array.isArray(data.viagens) ? data.viagens : [];

    return viagens.map((v): ViagemUnificada => ({
      id: `op-${v.id}`,
      provider: 'ouro-prata',
      origem: params.origem,
      destino: params.destino,
      dataPartida: params.data,
      horarioPartida: v.horarioSaida,
      horarioChegada: v.horarioChegada,
      duracao: calcularDuracao(v.horarioSaida, v.horarioChegada),
      preco: v.preco,
      assentosDisponiveis:
        typeof v.assentosDisponiveis === 'number' ? v.assentosDisponiveis : 10,
      tipo: v.tipoOnibus ?? 'Convencional',
      nomeEmpresa: 'Ouro e Prata',
      dadosReserva: v,
    }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro ao buscar Ouro e Prata:', error);
    return [];
  }
}

// ============================================
// GERAR RESULTADOS DISTRIBUSION (redirect)
// ============================================
async function gerarResultadosDistribusion(
  params: SearchParams
): Promise<ViagemUnificada[]> {
  const deviceId = generateDeviceId();

  const urlDistribusion = new URL('https://book.distribusion.com/result');
  urlDistribusion.searchParams.set('departureDate', params.data);
  urlDistribusion.searchParams.set('pax', String(params.passageiros ?? 1));
  urlDistribusion.searchParams.set('departureCity', params.origem);
  urlDistribusion.searchParams.set('arrivalCity', params.destino);
  urlDistribusion.searchParams.set('currency', 'BRL');
  urlDistribusion.searchParams.set('locale', 'pt-BR');
  urlDistribusion.searchParams.set('retailerPartnerNumber', '81499');
  urlDistribusion.searchParams.set('deviceId', deviceId);

  return [
    {
      id: 'dist-redirect',
      provider: 'distribusion',
      origem: params.origem,
      destino: params.destino,
      dataPartida: params.data,
      horarioPartida: '--:--',
      horarioChegada: '--:--',
      duracao: 'Vários horários',
      preco: 0,
      assentosDisponiveis: 999,
      tipo: 'Múltiplas empresas',
      nomeEmpresa: 'Distribusion Partners',
      urlDistribusion: urlDistribusion.toString(),
    },
  ];
}

// ============================================
// SE VOCÊ TIVER A API KEY DA DISTRIBUSION
// ============================================
async function buscarDistribusionComAPI(
  params: SearchParams
): Promise<ViagemUnificada[]> {
  const API_KEY = process.env.DISTRIBUSION_API_KEY;

  if (!API_KEY) {
    // eslint-disable-next-line no-console
    console.warn('API Key da Distribusion não configurada');
    return [];
  }

  try {
    const url = new URL(
      'https://api.distribusion.com/retailers/v4/connections/find'
    );
    url.searchParams.append('departure_stations[]', params.origem);
    url.searchParams.append('arrival_stations[]', params.destino);
    url.searchParams.append('departure_date', params.data);
    url.searchParams.append('currency', 'BRL');
    url.searchParams.append('locale', 'pt-BR');
    url.searchParams.append('passengers[][pax]', String(params.passageiros ?? 1));

    const response = await fetch(url.toString(), {
      headers: {
        'api-key': API_KEY,
        'Content-Type': 'application/json',
        'cache-control': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API Distribusion erro: ${response.status}`);
    }

    const data = (await response.json()) as DistribusionFindResponse;
    const connections = Array.isArray(data.data) ? data.data : [];

    return connections.map((connection): ViagemUnificada => {
      const attrs = connection.attributes;
      const deviceId = generateDeviceId();

      const bookingUrl = new URL('https://book.distribusion.com/result');
      bookingUrl.searchParams.set('departureDate', params.data);
      bookingUrl.searchParams.set('pax', String(params.passageiros ?? 1));
      bookingUrl.searchParams.set('departureCity', params.origem);
      bookingUrl.searchParams.set('arrivalCity', params.destino);
      bookingUrl.searchParams.set('currency', 'BRL');
      bookingUrl.searchParams.set('locale', 'pt-BR');
      bookingUrl.searchParams.set('retailerPartnerNumber', '81499');
      bookingUrl.searchParams.set('deviceId', deviceId);

      return {
        id: `dist-${connection.id}`,
        provider: 'distribusion',
        origem: params.origem,
        destino: params.destino,
        dataPartida: params.data,
        horarioPartida: attrs.departure_time,
        horarioChegada: attrs.arrival_time,
        duracao: formatarDuracao(attrs.duration),
        preco: attrs.cheapest_total_adult_price ?? 0,
        assentosDisponiveis: 10, // API não expõe diretamente
        tipo: attrs.travel_class ?? 'Standard',
        nomeEmpresa: attrs.marketing_carrier_name ?? 'Parceiro',
        urlDistribusion: bookingUrl.toString(),
      };
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro ao buscar na API Distribusion:', error);
    return [];
  }
}

// ============================================
// UTILITÁRIOS
// ============================================
function calcularDuracao(inicio: HHMM, fim: HHMM): string {
  const [h1Str, m1Str] = inicio.split(':');
  const [h2Str, m2Str] = fim.split(':');
  const h1 = Number(h1Str);
  const m1 = Number(m1Str);
  const h2 = Number(h2Str);
  const m2 = Number(m2Str);

  if (
    !Number.isFinite(h1) ||
    !Number.isFinite(m1) ||
    !Number.isFinite(h2) ||
    !Number.isFinite(m2)
  ) {
    return 'N/A';
  }

  let minutos = h2 * 60 + m2 - (h1 * 60 + m1);
  if (minutos < 0) minutos += 24 * 60;

  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;

  return `${horas}h${mins > 0 ? ` ${mins}min` : ''}`;
}

function formatarDuracao(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${horas}h${mins > 0 ? ` ${mins}min` : ''}`;
}

function generateDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}
