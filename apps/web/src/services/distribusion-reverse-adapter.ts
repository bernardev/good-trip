import {
  UnifiedTrip,
  City,
  DistribusionConnection,
  DistribusionResponse,
} from '../types/unified-trip';

/** Recursos mínimos do `included` que precisamos */
type StationIncluded = {
  id: string;
  type: 'stations';
  attributes: {
    code?: string;   // ex: BRBELBBU
    name?: string;   // ex: Terminal Rodoviário de Belém
  };
  relationships?: {
    city?: { data?: { id?: string } | null };
  };
};

type CityIncluded = {
  id: string;
  type: 'cities';
  attributes: {
    code?: string;   // ex: BRBEL
    name?: string;   // ex: Belém
  };
};

type MarketingCarrierIncluded = {
  id: string;
  type: 'marketing_carriers';
  attributes: {
    code?: string;       // ex: SMAI
    trade_name?: string; // ex: Santa Maria
  };
};

type FareIncluded = {
  id: string;
  type: 'fares';
  attributes: {
    price?: number; // em centavos
  };
};

type IncludedKnown =
  | StationIncluded
  | CityIncluded
  | MarketingCarrierIncluded
  | FareIncluded;

/**
 * Adapter que usa a API pública da Distribusion
 * Não requer API Key, apenas o partnerNumber
 */
export class DistribusionReverseAdapter {
  private partnerNumber: string;
  private baseUrl = 'https://book.api.distribusion.com/api';

  constructor(partnerNumber: string = '814999') {
    this.partnerNumber = partnerNumber;
  }

  /**
   * Busca viagens na API pública da Distribusion
   */
  async searchTrips(params: {
    departureCity: string;
    arrivalCity: string;
    departureDate: string; // YYYY-MM-DD
    passengers: number;
  }): Promise<UnifiedTrip[]> {
    try {
      const url = this.buildSearchUrl(params);

      console.log('🔍 Buscando na Distribusion:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Distribusion API error: ${response.status}`);
      }

      const data: DistribusionResponse = await response.json();

      console.log(`✅ Distribusion retornou ${data.data?.length || 0} viagens`);

      return this.normalizeTrips(data.data || [], data.included || [], params.passengers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro ao buscar na Distribusion:', errorMessage);
      return [];
    }
  }

  /**
   * Constrói a URL de busca com os parâmetros corretos
   */
  private buildSearchUrl(params: {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    passengers: number;
  }): string {
    const searchParams = new URLSearchParams();

    // Estrutura de query params da Distribusion
    searchParams.append('search_bounds[0][departure_location][type]', 'city');
    searchParams.append('search_bounds[0][departure_location][value][]', params.departureCity);
    searchParams.append('search_bounds[0][arrival_location][type]', 'city');
    searchParams.append('search_bounds[0][arrival_location][value][]', params.arrivalCity);
    searchParams.append('search_bounds[0][departure_date]', params.departureDate);
    searchParams.append('search_bounds[0][departure_start_time]', '00:00');
    searchParams.append('search_bounds[0][is_requested]', 'true');
    searchParams.append('pax', params.passengers.toString());
    searchParams.append('locale', 'pt-BR');
    searchParams.append('currency', 'BRL');
    searchParams.append('retailerPartnerNumber', this.partnerNumber);

    return `${this.baseUrl}/connections?${searchParams.toString()}`;
  }

  /**
   * Converte resposta da Distribusion para formato unificado
   * Corrige: nome da empresa, logo, preço (centavos) e gera link para a tela Result
   */
  private normalizeTrips(
    connections: DistribusionConnection[],
    included: DistribusionResponse['included'] = [],
    pax: number = 1
  ): UnifiedTrip[] {
    // Indexa apenas os tipos que vamos consultar
    const idxStations = new Map<string, StationIncluded>();
    const idxCities = new Map<string, CityIncluded>();
    const idxCarriers = new Map<string, MarketingCarrierIncluded>();
    const idxFares = new Map<string, FareIncluded>();

    for (const item of included as IncludedKnown[]) {
      switch (item.type) {
        case 'stations':
          idxStations.set(item.id, item);
          break;
        case 'cities':
          idxCities.set(item.id, item);
          break;
        case 'marketing_carriers':
          idxCarriers.set(item.id, item);
          break;
        case 'fares':
          idxFares.set(item.id, item);
          break;
        default:
          break;
      }
    }

    const getCityFromStation = (stationId: string | undefined): { code: string; name: string } => {
      if (!stationId) return { code: '', name: '' };
      const st = idxStations.get(stationId);
      const cityId = st?.relationships?.city?.data?.id ?? undefined;
      const city = cityId ? idxCities.get(cityId) : undefined;
      return {
        code: city?.attributes.code ?? (st?.attributes.code?.slice(0, 5) ?? ''),
        name: city?.attributes.name ?? (st?.attributes.name ?? ''),
      };
    };

    return connections
      .filter((c) => c.type === 'connections')
      .map((conn): UnifiedTrip => {
        const a = conn.attributes;

        // IDs relacionados vindos do objeto connection
        const depStationId =
          (conn.relationships?.departure_station as { data?: { id?: string } } | undefined)?.data?.id || '';
        const arrStationId =
          (conn.relationships?.arrival_station as { data?: { id?: string } } | undefined)?.data?.id || '';
        const carrierId =
          (conn.relationships?.marketing_carrier as { data?: { id?: string } } | undefined)?.data?.id || '';

        // Estações (códigos) — mantidos caso precise no futuro
        const depStationCode = depStationId ? idxStations.get(depStationId)?.attributes.code ?? '' : '';
        const arrStationCode = arrStationId ? idxStations.get(arrStationId)?.attributes.code ?? '' : '';
        void depStationCode; // evitar TS 'unused' se não usar
        void arrStationCode;

        // Cidades (códigos de 5 letras para a tela Result)
        const dep = getCityFromStation(depStationId);
        const arr = getCityFromStation(arrStationId);

        // Empresa + logo
        const carrier = carrierId ? idxCarriers.get(carrierId) : undefined;
        const marketingCarrierCode = carrier?.attributes.code ?? '';
        const carrierName = carrier?.attributes.trade_name ?? 'Desconhecido';
        const carrierLogo = marketingCarrierCode
          ? `${this.baseUrl}/marketing_carriers/${marketingCarrierCode}/logo`
          : undefined;

        // Preço (centavos) → preferir cheapest_total_adult_price; fallback: 1º fare listado
        let priceCents: number = a.cheapest_total_adult_price ?? 0;
        if (!priceCents) {
          const faresRel =
            (conn.relationships?.fares as { data?: Array<{ id: string }> } | undefined)?.data ?? [];
          const firstFareId = faresRel[0]?.id;
          if (firstFareId) {
            const fare = idxFares.get(firstFareId);
            priceCents = fare?.attributes.price ?? 0;
          }
        }

        // URL para a tela Result (em vez de tentar o checkout direto)
        const bookingUrl = this.generateResultUrl({
          departureCityCode: dep.code,
          arrivalCityCode: arr.code,
          departureISO: a.departure_time,
          pax,
        });

        return {
          id: `dist-${conn.id}`,
          provider: 'distribusion',

          // Cidades
          departureCity: dep.name,
          departureCityCode: dep.code,
          arrivalCity: arr.name,
          arrivalCityCode: arr.code,

          // Horários e duração (API retorna duration em segundos)
          departureTime: a.departure_time,
          arrivalTime: a.arrival_time,
          duration: typeof a.duration === 'number' ? Math.round(a.duration / 60) : 0,

          // Empresa
          carrier: carrierName,
          carrierLogo,

          // Preço
          price: priceCents / 100,
          currency: 'BRL',

          // Detalhes
          availableSeats: a.total_seats_left ?? a.available_seats ?? 0,
          busType: undefined,
          amenities: [],

          // URL (vai para a busca/Result)
          bookingUrl,

          // Dados originais
          rawData: conn,
        };
      });
  }

  /**
   * (Opcional) Extrai código da cidade do ID da conexão (legado)
   */
  private extractCityCode(connectionId: string, type: 'departure' | 'arrival'): string {
    const parts = connectionId.split('-');
    if (parts.length >= 3) {
      return type === 'departure' ? parts[1].substring(0, 5) : parts[2].substring(0, 5);
    }
    return '';
  }

  /**
   * (Legado) Calcula duração em minutos a partir de timestamps
   */
  private calculateDuration(departure: string, arrival: string): number {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    return Math.round((arr.getTime() - dep.getTime()) / 1000 / 60);
  }

  /**
   * Gera URL para a tela "Result" (busca) da Distribusion.
   * O usuário escolherá o assento / tarifa lá.
   */
  private generateResultUrl(args: {
    departureCityCode: string; // ex: BRXDM
    arrivalCityCode: string;   // ex: BRIUN
    departureISO: string;      // ex: 2025-11-04T08:45
    pax?: number;
  }): string {
    const departureDate = args.departureISO.slice(0, 10); // YYYY-MM-DD
    const p = new URLSearchParams({
      departureDate,
      pax: String(args.pax ?? 1),
      currency: 'BRL',
      locale: 'pt-BR',
      retailerPartnerNumber: this.partnerNumber,
      deviceId: 'gt-web',
      seatProduct: 'false',
      departureCity: args.departureCityCode,
      arrivalCity: args.arrivalCityCode,
    });
    return `https://book.distribusion.com/result?${p.toString()}`;
  }

  /**
   * Busca cidades disponíveis (sua lista expandida)
   */
  async getCities(): Promise<City[]> {
    return [
      { code: 'BREJR', name: 'Alfredo Wagner' },
      { code: 'BRTEC', name: 'Aracaju' },
      { code: 'BRSMZ', name: 'Araçatuba' },
      { code: 'BRBHZ', name: 'Belo Horizonte' },
      { code: 'BREDN', name: 'Campo Grande' },
      { code: 'BRNHC', name: 'Campinas' },
      { code: 'BRFVP', name: 'Cascavel' },
      { code: 'BRCQF', name: 'Colombo' },
      { code: 'BRXDM', name: 'Curitiba' },
      { code: 'BRIOL', name: 'Cuiabá' },
      { code: 'BRGJB', name: 'Eunápolis' },
      { code: 'BRZCN', name: 'Feira de Santana' },
      { code: 'BRIUN', name: 'Florianópolis' },
      { code: 'BRQEG', name: 'Foz do Iguaçu' },
      { code: 'BRPFR', name: 'Frederico Westphalen' },
      { code: 'BRALC', name: 'Goiânia' },
      { code: 'BRDHK', name: 'Governador Valadares' },
      { code: 'BRDVY', name: 'Guarapuava' },
      { code: 'BRIAB', name: 'Itabirito' },
      { code: 'BRDUW', name: 'Itu' },
      { code: 'BRVTO', name: 'Joinville' },
      { code: 'BRVHB', name: 'Juiz de Fora' },
      { code: 'BRAWR', name: 'Kaloré' },
      { code: 'BRCPF', name: 'Limeira' },
      { code: 'BRINV', name: 'Lins' },
      { code: 'BRSHJ', name: 'Londrina' },
      { code: 'BRLIU', name: 'Maceió' },
      { code: 'BRIVJ', name: 'Marabá' },
      { code: 'BRFWA', name: 'Maringá' },
      { code: 'BRQRP', name: 'Marília' },
      { code: 'BRJXV', name: 'Natal' },
      { code: 'BRXGR', name: 'Niterói' },
      { code: 'BRITG', name: 'Nova Mutum' },
      { code: 'BRRNK', name: 'Nova Xavantina' },
      { code: 'BRWFU', name: 'Nova Iguaçu' },
      { code: 'BRNRT', name: 'Novo Hamburgo' },
      { code: 'BRODT', name: 'Olímpia' },
      { code: 'BRIPT', name: 'Osasco' },
      { code: 'BROBR', name: 'Ouro Branco' },
      { code: 'BRXPS', name: 'Ourinhos' },
      { code: 'BRPER', name: 'Petrópolis' },
      { code: 'BRFOT', name: 'Ponta Grossa' },
      { code: 'BRPOA', name: 'Porto Alegre' },
      { code: 'BRICE', name: 'Porto União' },
      { code: 'BRPOR', name: 'Porto Velho' },
      { code: 'BRPKU', name: 'Presidente Kubitschek' },
      { code: 'BRQDI', name: 'Quedas do Iguaçu' },
      { code: 'BRQUE', name: 'Querência' },
      { code: 'BRQUR', name: 'Quirinópolis' },
      { code: 'BRPGQ', name: 'Rancho Queimado' },
      { code: 'BROPM', name: 'Ribeirão Preto' },
      { code: 'BRRKO', name: 'Rincão dos Kroeff' },
      { code: 'BRLZS', name: 'Rio de Janeiro' },
      { code: 'BRQYU', name: 'Salvador' },
      { code: 'BRMJZ', name: 'Santa Quitéria' },
      { code: 'BRSAO', name: 'São Paulo' },
      { code: 'BRUQR', name: 'São Félix do Xingu' },
      { code: 'BRTMS', name: 'São José do Rio Preto' },
      { code: 'BRZCS', name: 'São Luís' },
      { code: 'BRYBP', name: 'Teófilo Otoni' },
      { code: 'BRTJL', name: 'Três Lagoas' },
      { code: 'BRLKF', name: 'Uberaba' },
      { code: 'BRLTJ', name: 'Uberlândia' },
      { code: 'BRVJZ', name: 'Umuarama' },
      { code: 'BRXBE', name: 'Vitória' },
      { code: 'BRNFQ', name: 'Vitória da Conquista' },
      { code: 'BRAQW', name: 'Volta Redonda' },
      { code: 'BRWBA', name: 'Wenceslau Braz' },
      { code: 'BRWEN', name: 'Werneck' },
      { code: 'BRFYM', name: 'Xanxerê' },
      { code: 'BRZXO', name: 'Xinguara' },
      { code: 'BRXXI', name: 'Xique-Xique' },
      { code: 'BRZDO', name: 'Zé Doca' },
    ];
  }
}
