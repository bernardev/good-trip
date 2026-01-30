// viop-adapter.ts
import {
  UnifiedTrip,
  ViopCity,
  ViopCitiesResponse,
  ViopTrip,
} from '../types/unified-trip';
import { ConexaoData, normalizarConexao } from '../lib/viop-types-conexoes';

/** -------- Tipos da resposta de /api/viop/corridas -------- */
interface ViopCorridaSimples {
  id: string;
  origem: string;
  destino: string;
  dataPartida: string;    // YYYY-MM-DD
  horarioPartida: string; // HH:MM
  horarioChegada: string; // HH:MM
  duracao: string;        // ex: "8h 30min"
  preco: number;
  assentosDisponiveis: number;
  tipo: string;
  nomeEmpresa: string;
  servico?: string;       // opcional; quando presente, é o ID do serviço
  conexao?: ConexaoData;  // 🔥 NOVO: dados de conexão
}

interface ViopCorridasResponse {
  total: number;
  corridas: ViopCorridaSimples[];
}

/** -------- Tipos da resposta de /api/viop/onibus -------- */
interface ViopServiceMeta {
  servico?: string;
  preco?: number;
  precoOriginal?: number;
  tarifa?: number;
  classe?: string;
  empresa?: string;
  empresaId?: number;
  poltronasTotal?: number;
  poltronasLivres?: number;
  dataCorrida?: string; // YYYY-MM-DD
  saida?: string;       // pode vir como "YYYY-MM-DD HH:MM" ou "HH:MM"
  chegada?: string;     // pode vir como "YYYY-MM-DD HH:MM" ou "HH:MM"
}

interface ViopSeatsInfo {
  origem?: { cidade?: string; id?: number };
  destino?: { cidade?: string; id?: number };
}

interface ViopOnibusResponse {
  ok: boolean;
  usedBody?: {
    servico?: string;
    origem?: string;
    destino?: string;
    data?: string;
  };
  serviceMeta?: ViopServiceMeta;
  seats?: ViopSeatsInfo;
}

/**
 * Adapter para a API da VIOP
 */
export class ViopAdapter {
  /** Base URL para rodar no server (SSR) e no client sem quebrar */
  private getBaseUrl(): string {
    if (typeof window === 'undefined') {
      return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    }
    return window.location.origin;
  }

  /**
   * Busca viagens na API da VIOP
   */
  async searchTrips(params: {
    departureCity: string;   // origemId (ex: "3603")
    arrivalCity: string;     // destinoId (ex: "10089")
    departureDate: string;   // YYYY-MM-DD
    passengers: number;
  }): Promise<UnifiedTrip[]> {
    try {
      console.log('🔍 [VIOP] Buscando:', params);
      const baseUrl = this.getBaseUrl();

      // 1) Corridas (lista de serviços)
      const corridasUrl =
        `${baseUrl}/api/viop/corridas?origemId=${encodeURIComponent(params.departureCity)}` +
        `&destinoId=${encodeURIComponent(params.arrivalCity)}&data=${params.departureDate}`;

      console.log('🔗 [VIOP] Buscando corridas:', corridasUrl);

      const corridasResponse = await fetch(corridasUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!corridasResponse.ok) {
        throw new Error(`Erro na API VIOP corridas: ${corridasResponse.status}`);
      }

      const corridasData: ViopCorridasResponse = await corridasResponse.json();
      console.log('📦 [VIOP] Corridas encontradas:', corridasData.total);

      const lista = corridasData.corridas ?? [];
      if (lista.length === 0) {
        console.log('⚠️ [VIOP] Nenhuma corrida encontrada');
        return [];
      }

      // 2) Para cada corrida, processar
      const tripsPromises = lista.map(async (corrida) => {
        // Detectar se é conexão
        if (corrida.conexao) {
          return this.processarConexao(corrida, params);
        }

        // Viagem normal (sem conexão)
        const servicoId = corrida.servico || this.extractServicoFromCorridaId(corrida.id) || corrida.id;

        const onibusUrl =
          `${baseUrl}/api/viop/onibus?origemId=${encodeURIComponent(params.departureCity)}` +
          `&destinoId=${encodeURIComponent(params.arrivalCity)}` +
          `&data=${params.departureDate}&servico=${encodeURIComponent(servicoId)}`;

        console.log('🔗 [VIOP] Buscando detalhes:', onibusUrl);

        try {
          const onibusResponse = await fetch(onibusUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
          });

          if (!onibusResponse.ok) {
            console.warn(`⚠️ [VIOP] Erro ao buscar serviço ${servicoId}: ${onibusResponse.status}`);
            return null;
          }

          const onibusData: ViopOnibusResponse = await onibusResponse.json();

          if (!onibusData.ok || !onibusData.serviceMeta) {
            console.warn(`⚠️ [VIOP] Dados inválidos para serviço ${servicoId}`);
            return null;
          }

          // Normaliza já com os IDs necessários para booking/assentos
          return this.normalizeTrip(
            corrida,
            onibusData,
            params.departureCity,
            params.arrivalCity,
            params.departureDate,
            servicoId
          );
        } catch (err) {
          console.error(`❌ [VIOP] Erro ao buscar serviço ${servicoId}:`, err);
          return null;
        }
      });

      const trips = (await Promise.all(tripsPromises)).filter(
        (t): t is UnifiedTrip => t !== null
      );

      console.log(`✅ [VIOP] ${trips.length} viagens processadas com sucesso`);
      return trips;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ [VIOP] Erro:', msg);
      return [];
    }
  }

  /**
   * Processa viagem com CONEXÃO
   */
  private processarConexao(
    corrida: ViopCorridaSimples,
    params: {
      departureCity: string;
      arrivalCity: string;
      departureDate: string;
    }
  ): UnifiedTrip | null {
    if (!corrida.conexao) return null;

    try {
      // Normalizar dados da conexão
      const conexaoNorm = normalizarConexao(corrida.conexao);

      const origemNome = conexaoNorm.trechos[0].origemDescricao;
      const destinoNome = conexaoNorm.trechos[1].destinoDescricao;

      // Horários
      const horaSaida = conexaoNorm.trechos[0].horaSaida;
      const horaChegada = conexaoNorm.trechos[1].horaChegada;

      const departureTime = this.combineDateTime(params.departureDate, horaSaida);
      const arrivalTime = this.combineDateTime(params.departureDate, horaChegada);

      // ViopTrip para compatibilidade
      const viopTrip: ViopTrip = {
        id: corrida.id,
        origem: origemNome,
        destino: destinoNome,
        dataHoraSaida: departureTime,
        dataHoraChegada: arrivalTime,
        duracao: conexaoNorm.duracaoTotal,
        empresa: conexaoNorm.trechos[0].empresa, // empresa do primeiro trecho
        valor: conexaoNorm.precoTotal,
        poltronasDisponiveis: conexaoNorm.assentosDisponiveis,
        tipoOnibus: 'Conexão',
        servicos: [],
      };

      // URL para página de detalhes da conexão
      const bookingParams = new URLSearchParams({
        servico: corrida.id,  // ✅
        origem: params.departureCity,
        destino: params.arrivalCity,
        data: params.departureDate,
      });

      return {
        id: `viop-conexao-${corrida.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        provider: 'viop',
        departureCity: origemNome,
        departureCityCode: params.departureCity,
        arrivalCity: destinoNome,
        arrivalCityCode: params.arrivalCity,
        departureTime,
        arrivalTime,
        duration: conexaoNorm.duracaoTotal,
        carrier: `${conexaoNorm.trechos[0].empresa} / ${conexaoNorm.trechos[1].empresa}`,
        carrierLogo: '/logos/viop-logo.png',
        price: conexaoNorm.precoTotal,
        currency: 'BRL',
        availableSeats: conexaoNorm.assentosDisponiveis,
        busType: 'Conexão',
        amenities: [],
        bookingUrl: `/buscar-viop/conexao?${bookingParams.toString()}`,
        conexao: conexaoNorm, // 🔥 Adiciona dados da conexão
        rawData: viopTrip,
      };
    } catch (error) {
      console.error(`❌ [VIOP] Erro ao processar conexão ${corrida.id}:`, error);
      return null;
    }
  }

  /**
   * Tenta extrair o ID do serviço a partir de um ID composto de corrida
   */
  private extractServicoFromCorridaId(id: string): string {
    const parts = id.split('-');
    return parts.length > 0 ? parts[0] : '';
  }

  /**
   * Converte dados da VIOP para formato unificado
   */
  private normalizeTrip(
    corrida: ViopCorridaSimples,
    onibusData: ViopOnibusResponse,
    origemId: string,
    destinoId: string,
    dataBusca: string,    // YYYY-MM-DD
    servicoId: string
  ): UnifiedTrip {
    const meta = onibusData.serviceMeta!;
    const seats = onibusData.seats;

    // Campos base
    const origemNome = seats?.origem?.cidade || corrida.origem;
    const destinoNome = seats?.destino?.cidade || corrida.destino;
    const preco = this.safeNumber(meta.preco, corrida.preco);
    const assentos = this.safeNumber(meta.poltronasLivres, corrida.assentosDisponiveis);
    const classe = meta.classe || corrida.tipo;
    const empresa = meta.empresa || corrida.nomeEmpresa;
    const saida = meta.saida || corrida.horarioPartida;
    const chegada = meta.chegada || corrida.horarioChegada;

    // 🔥 CORREÇÃO: Datas/hora ISO
    const departureTime = this.combineDateTime(corrida.dataPartida || dataBusca, saida);
    const arrivalTime = this.combineDateTime(corrida.dataPartida || dataBusca, chegada);

    // Duração em minutos
    const duracaoMin = corrida.duracao
      ? this.parseDurationToMinutes(corrida.duracao)
      : this.calculateDurationFromTimes(departureTime, arrivalTime);

    // Dados brutos
    const viopTrip: ViopTrip = {
      id: corrida.id,
      origem: origemNome,
      destino: destinoNome,
      dataHoraSaida: departureTime,
      dataHoraChegada: arrivalTime,
      duracao: duracaoMin,
      empresa,
      valor: preco,
      poltronasDisponiveis: assentos,
      tipoOnibus: classe,
      servicos: [],
    };

    // URL para fluxo VIOP
    const bookingParams = new URLSearchParams({
      servico: servicoId,
      origem: origemId,
      destino: destinoId,
      data: dataBusca,
    });

    return {
      id: `viop-${corrida.id}`,
      provider: 'viop',
      departureCity: origemNome,
      departureCityCode: origemId,
      arrivalCity: destinoNome,
      arrivalCityCode: destinoId,
      departureTime,
      arrivalTime,
      duration: duracaoMin,
      carrier: empresa || 'Viação Ouro e Prata',
      carrierLogo: '/logos/viop-logo.png',
      price: preco,
      currency: 'BRL',
      availableSeats: assentos,
      busType: classe,
      amenities: [],
      bookingUrl: `/buscar-viop/assentos?${bookingParams.toString()}`,
      rawData: viopTrip,
    };
  }

  /** Helpers */
  private safeNumber(primary?: number, fallback?: number): number {
    const p = typeof primary === 'number' && !Number.isNaN(primary) ? primary : undefined;
    const f = typeof fallback === 'number' && !Number.isNaN(fallback) ? fallback : undefined;
    return (p ?? f ?? 0);
  }

  /**
   * 🔥 CORRIGIDO: Aceita "YYYY-MM-DD HH:MM:SS" ou "HH:MM"
   */
private combineDateTime(date: string, time: string): string {
  if (!time || time === '--:--') {
    return new Date().toISOString();
  }
  
  // Se time já vem no formato "YYYY-MM-DD HH:MM:SS" ou "YYYY-MM-DD HH:MM"
  if (time.includes(' ')) {
    const [datePart, timePart] = time.split(' ');
    const hhmm = timePart.length > 5 ? timePart.slice(0, 5) : timePart;
    return `${datePart}T${hhmm}:00-03:00`;  // ✅ Adiciona timezone brasileiro
  }
  
  // Formato antigo: apenas "HH:MM"
  if (!date) {
    return new Date().toISOString();
  }
  const hhmm = time.length > 5 ? time.slice(0, 5) : time;
  return `${date}T${hhmm}:00-03:00`;  // ✅ Adiciona timezone brasileiro
}

  /**
   * Calcula duração em minutos entre duas datas ISO
   */
  private calculateDurationFromTimes(departureISO: string, arrivalISO: string): number {
    try {
      const dep = new Date(departureISO);
      const arr = new Date(arrivalISO);
      if (isNaN(dep.getTime()) || isNaN(arr.getTime())) return 0;
      
      const diffMs = arr.getTime() - dep.getTime();
      return Math.max(0, Math.floor(diffMs / 60000));
    } catch {
      return 0;
    }
  }

  /**
   * Converte "Xh Ymin" -> minutos
   */
  private parseDurationToMinutes(duracao: string | undefined): number {
    if (!duracao) return 0;
    const hMatch = duracao.match(/(\d+)h/);
    const mMatch = duracao.match(/(\d+)min/);
    const h = hMatch ? parseInt(hMatch[1], 10) : 0;
    const m = mMatch ? parseInt(mMatch[1], 10) : 0;
    return h * 60 + m;
  }

  /** -------- Autocomplete -------- */
  async searchCities(query: string): Promise<ViopCity[]> {
    try {
      const baseUrl = this.getBaseUrl();
      const res = await fetch(`${baseUrl}/api/viop/origens?q=${encodeURIComponent(query)}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Erro na API: ${res.status}`);
      const data: ViopCitiesResponse = await res.json();
      return data.ok ? (data.items ?? []) : [];
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao buscar cidades VIOP:', msg);
      return [];
    }
  }

  async searchDestinations(origemId: string, query: string): Promise<ViopCity[]> {
    try {
      const baseUrl = this.getBaseUrl();
      const url =
        `${baseUrl}/api/viop/destinos?origemId=${encodeURIComponent(origemId)}` +
        `&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erro na API: ${res.status}`);
      const data: ViopCitiesResponse = await res.json();
      return data.ok ? (data.items ?? []) : [];
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao buscar destinos VIOP:', msg);
      return [];
    }
  }
}