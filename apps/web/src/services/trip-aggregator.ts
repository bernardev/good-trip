import { 
  UnifiedTrip, 
  SearchParams, 
  UnifiedSearchResult,
  CityWithProvider 
} from '../types/unified-trip';
import { DistribusionReverseAdapter } from './distribusion-reverse-adapter';
import { ViopAdapter } from './viop-adapter';

type SortField = 'price' | 'departure' | 'duration' | 'arrival';
type SortOrder = 'asc' | 'desc';

interface TripFilters {
  maxPrice?: number;
  minDeparture?: string;
  maxDeparture?: string;
  carriers?: string[];
  providers?: string[];
  amenities?: string[];
}

export class TripAggregatorService {
  private distribusion: DistribusionReverseAdapter;
  private viop: ViopAdapter;

  constructor() {
    this.distribusion = new DistribusionReverseAdapter(
      process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER_NUMBER || '814999'
    );
    this.viop = new ViopAdapter();
  }

  /**
   * Busca viagens em ambas as APIs simultaneamente
   */
  async searchTrips(params: SearchParams): Promise<UnifiedSearchResult> {
    const searchParams = {
      departureCity: params.departureCity,
      arrivalCity: params.arrivalCity,
      departureDate: params.departureDate,
      passengers: params.passengers,
    };

    // Busca paralela em ambas as APIs
    const [distribusionResult, viopResult] = await Promise.allSettled([
      this.distribusion.searchTrips(searchParams),
      this.viop.searchTrips(searchParams),
    ]);

    // Processa resultados
    const distribusionTrips =
      distribusionResult.status === 'fulfilled' ? distribusionResult.value : [];
    const viopTrips =
      viopResult.status === 'fulfilled' ? viopResult.value : [];

    // Combina e ordena por horário de partida
    const allTrips = [...distribusionTrips, ...viopTrips].sort(
      (a, b) =>
        new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    );

    return {
      trips: allTrips,
      searchParams: params,
      providers: {
        distribusion: {
          success: distribusionResult.status === 'fulfilled',
          count: distribusionTrips.length,
          error:
            distribusionResult.status === 'rejected'
              ? distribusionResult.reason?.message
              : undefined,
        },
        viop: {
          success: viopResult.status === 'fulfilled',
          count: viopTrips.length,
          error:
            viopResult.status === 'rejected'
              ? viopResult.reason?.message
              : undefined,
        },
      },
    };
  }

  /**
   * Filtra viagens por critérios
   */
  filterTrips(trips: UnifiedTrip[], filters: TripFilters): UnifiedTrip[] {
    return trips.filter((trip) => {
      if (filters.maxPrice && trip.price > filters.maxPrice) {
        return false;
      }

      if (
        filters.minDeparture &&
        new Date(trip.departureTime) < new Date(filters.minDeparture)
      ) {
        return false;
      }

      if (
        filters.maxDeparture &&
        new Date(trip.departureTime) > new Date(filters.maxDeparture)
      ) {
        return false;
      }

      if (filters.carriers && !filters.carriers.includes(trip.carrier)) {
        return false;
      }

      if (filters.providers && !filters.providers.includes(trip.provider)) {
        return false;
      }

      if (filters.amenities && trip.amenities) {
        const hasAllAmenities = filters.amenities.every((amenity) =>
          trip.amenities?.includes(amenity)
        );
        if (!hasAllAmenities) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Ordena viagens por diferentes critérios
   */
  sortTrips(
    trips: UnifiedTrip[],
    sortBy: SortField,
    order: SortOrder = 'asc'
  ): UnifiedTrip[] {
    const sorted = [...trips].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'departure':
          comparison =
            new Date(a.departureTime).getTime() -
            new Date(b.departureTime).getTime();
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'arrival':
          comparison =
            new Date(a.arrivalTime).getTime() -
            new Date(b.arrivalTime).getTime();
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Agrupa viagens por empresa
   */
  groupByCarrier(trips: UnifiedTrip[]): Record<string, UnifiedTrip[]> {
    return trips.reduce((groups, trip) => {
      const carrier = trip.carrier;
      if (!groups[carrier]) {
        groups[carrier] = [];
      }
      groups[carrier].push(trip);
      return groups;
    }, {} as Record<string, UnifiedTrip[]>);
  }

  /**
   * Busca todas as cidades disponíveis de ambos provedores
   */
  async getAllCities(): Promise<CityWithProvider[]> {
    const [distribusionCities, viopCities] = await Promise.allSettled([
      this.distribusion.getCities(),
      this.viop.getCities(),
    ]);

    const allCities: CityWithProvider[] = [];

    if (distribusionCities.status === 'fulfilled') {
      allCities.push(
        ...distribusionCities.value.map((city) => ({
          ...city,
          provider: 'distribusion' as const,
        }))
      );
    }

    if (viopCities.status === 'fulfilled') {
      allCities.push(
        ...viopCities.value.map((city) => ({ 
          ...city, 
          provider: 'viop' as const 
        }))
      );
    }

    const uniqueCities = Array.from(
      new Map(allCities.map((city) => [city.code, city])).values()
    );

    return uniqueCities.sort((a, b) => a.name.localeCompare(b.name));
  }
}