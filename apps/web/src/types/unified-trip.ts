// Tipos unificados para viagens de diferentes provedores

// ======================= Utilitários =======================
export type Empty = Record<string, never>;

export type Provider = 'distribusion' | 'viop';

type RelOne<TType extends string> = { data?: { id: string; type?: TType } | null };
type RelMany<TType extends string> = { data?: Array<{ id: string; type?: TType }> };

type IncludedBase<
  TType extends string,
  A extends object = Empty,
  R extends object = Empty
> = {
  id: string;
  type: TType;
  attributes?: A;
  relationships?: R;
};

// ======================= Unified =======================
export interface UnifiedTrip {
  // Identificadores
  id: string;
  provider: Provider;

  // Informações básicas
  departureCity: string;
  departureCityCode: string;
  arrivalCity: string;
  arrivalCityCode: string;

  // Horários
  departureTime: string; // ISO 8601
  arrivalTime: string;   // ISO 8601
  duration: number;      // em minutos

  // Empresa
  carrier: string;
  carrierLogo?: string;

  // Preço
  price: number;
  currency: string;

  // Detalhes adicionais
  availableSeats?: number;
  busType?: string;
  amenities?: string[];

  // Link de reserva
  bookingUrl: string;

  // Dados originais (preservar para debugging)
  rawData: DistribusionConnection | ViopTrip;
}

export interface SearchParams {
  departureCity: string;
  arrivalCity: string;
  departureDate: string; // YYYY-MM-DD
  passengers: number;
}

export interface UnifiedSearchResult {
  trips: UnifiedTrip[];
  searchParams: SearchParams;
  providers: {
    distribusion: ProviderResult;
    viop: ProviderResult;
  };
}

export interface ProviderResult {
  success: boolean;
  count: number;
  error?: string;
}

// ======================= Distribusion: data =======================
export interface DistribusionConnection {
  id: string;
  type: 'connections' | string;

  attributes: {
    // horários
    departure_time: string; // "2025-11-04T05:20"
    arrival_time: string;   // "2025-11-05T11:39"

    // duração (em segundos no JSON da Distribusion)
    duration?: number;

    // nomes “legados”
    departure_station_name?: string;
    arrival_station_name?: string;
    marketing_carrier_name?: string;
    marketing_carrier_logo_url?: string;

    // preço/assentos (JSON real)
    cheapest_total_adult_price?: number; // centavos
    total_seats_left?: number;

    // compat legada
    price_cents?: number;
    available_seats?: number;
    vehicle_type?: string;
    has_wifi?: boolean;
    has_ac?: boolean;
    has_toilet?: boolean;
    has_tv?: boolean;
    has_power_outlets?: boolean;
    reclining_seats?: boolean;
  };

  // relacionamentos usados pelo adapter
  relationships?: {
    departure_station?: RelOne<'stations'>;
    arrival_station?: RelOne<'stations'>;
    marketing_carrier?: RelOne<'marketing_carriers'>;
    fares?: RelMany<'fares'>;
    segments?: RelMany<'segments'>;
  };
}

// ======================= Distribusion: included =======================

// stations
type StationIncluded = IncludedBase<
  'stations',
  {
    code?: string;
    name?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    street_and_number?: string;
    time_zone?: string;
    zip_code?: string;
  },
  { city?: RelOne<'cities'> }
>;

// cities
type CityIncluded = IncludedBase<'cities', { code?: string; name?: string }>;

// marketing_carriers
type MarketingCarrierIncluded = IncludedBase<
  'marketing_carriers',
  {
    code?: string;                // ex: EGUA
    trade_name?: string;          // ex: Expresso Guanabara
    legal_name?: string;
    booking_fee?: number;
    markup_fee_percentage?: number;
  }
>;

// operating_carriers (não usado diretamente, mas mapeado)
type OperatingCarrierIncluded = IncludedBase<
  'operating_carriers',
  { code?: string; trade_name?: string; legal_name?: string }
>;

// fares
type FareIncluded = IncludedBase<
  'fares',
  { price?: number; original_price?: number; booked_out?: boolean; seats_left?: number },
  { fare_class?: RelOne<'fare_classes'> }
>;

// segments
type SegmentIncluded = IncludedBase<
  'segments',
  {
    arrival_time?: string;
    departure_time?: string;
    index?: number;
    line?: string;
    segment_type?: string;
  },
  {
    arrival_station?: RelOne<'stations'>;
    departure_station?: RelOne<'stations'>;
    marketing_carrier?: RelOne<'marketing_carriers'>;
    operating_carrier?: RelOne<'operating_carriers'>;
    vehicle?: RelOne<'vehicles'>;
    fares?: RelMany<'fares'>;
  }
>;

// vehicles / vehicle_types
type VehicleIncluded = IncludedBase<'vehicles', Empty, { vehicle_type?: RelOne<'vehicle_types'> }>;
type VehicleTypeIncluded = IncludedBase<'vehicle_types', { code?: string }>;

// passenger_types
type PassengerTypeIncluded = IncludedBase<
  'passenger_types',
  { code?: string; name?: string; min_age?: number; max_age?: number; description?: string }
>;

// fare_classes / fare_features
type FareClassIncluded = IncludedBase<
  'fare_classes',
  { code?: string; name?: string; journey_type?: string; iata_category?: string | null },
  { fare_features?: RelMany<'fare_features'> }
>;

type FareFeatureIncluded = IncludedBase<
  'fare_features',
  { code?: string; name?: string; description?: string }
>;

// União final do included
export type DistribusionIncluded =
  | StationIncluded
  | CityIncluded
  | MarketingCarrierIncluded
  | OperatingCarrierIncluded
  | FareIncluded
  | SegmentIncluded
  | VehicleIncluded
  | VehicleTypeIncluded
  | PassengerTypeIncluded
  | FareClassIncluded
  | FareFeatureIncluded;

// Interface da resposta (sem any e sem objetos vazios literais)
export interface DistribusionResponse {
  data: DistribusionConnection[];
  included?: DistribusionIncluded[];
  jsonapi?: { version?: string };
  meta?: { currency?: string; locale?: string };
}

// ======================= VIOP =======================
export interface ViopTrip {
  id: string;
  origem: string;
  destino: string;
  dataHoraSaida: string;
  dataHoraChegada: string;
  duracao: number;
  empresa: string;
  valor: number;
  poltronasDisponiveis?: number;
  tipoOnibus?: string;
  servicos?: string[];
}

export interface ViopResponse {
  viagens: ViopTrip[];
}

// ======================= Cidades =======================
export interface City {
  code: string;
  name: string;
}

export interface CityWithProvider extends City {
  provider: Provider;
}

// ======================= Autocomplete =======================
export interface ViopCity {
  id: string;
  nome: string;
}

export interface ViopCitiesResponse {
  ok: boolean;
  items?: ViopCity[];
}

export interface AutocompleteCity {
  id: string;
  nome: string;
  source: 'viop' | 'distribusion';
}

// ======================= Tipos VIOP Corridas =======================
export interface ViopCorrida {
  id: string;
  origem: string;
  destino: string;
  dataPartida: string;
  horarioPartida: string;
  horarioChegada: string;
  duracao: string;
  preco: number;
  assentosDisponiveis: number;
  tipo: string;
  nomeEmpresa: string;
}
