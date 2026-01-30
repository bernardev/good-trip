// apps/web/src/components/UnifiedTripSearchV2.tsx
'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from './search/SearchBar';
import { DaySelector } from './search/DaySelector';
import { FilterSidebar, applyFilters, type FilterState } from './search/FilterSidebar';
import { TripCard } from './TripCard';
import type { UnifiedTrip, UnifiedSearchResult, ViopCitiesResponse, ViopCity } from '@/types/unified-trip';
import { ArrowUpDown, Loader2, SearchX, Sparkles, ChevronRight, Calendar, RefreshCw } from 'lucide-react';
import { ViopAdapter } from '@/services/viop-adapter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AutoSearchParams {
  origem: string;
  destino: string;
  data: string;
  tipo: 'oneway' | 'roundtrip';
  dataVolta?: string;
}

interface UnifiedTripSearchV2Props {
  viopOnly?: boolean;
  autoSearchParams?: AutoSearchParams;
}

type SortType = 'price' | 'duration' | 'departure';

function formatViopCity(nome: string): string {
  const cleaned = nome.trim().toUpperCase();
  const stateMatch = cleaned.match(/[A-Z]{2}$/);
  const estado = stateMatch ? stateMatch[0] : '';
  const cidadeMatch = cleaned.match(/^([^-]+)/);
  const cidadeRaw = cidadeMatch ? cidadeMatch[1].trim() : cleaned;
  const cidade = cidadeRaw
    .toLowerCase()
    .split(' ')
    .map((word) => 
      ['de', 'do', 'da', 'dos', 'das', 'e'].includes(word) 
        ? word 
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ')
    .replace(/\bSao\b/g, 'São');
  
  return estado ? `${cidade}/${estado}` : cidade;
}

export function UnifiedTripSearchV2({ 
  viopOnly = false,
  autoSearchParams
}: UnifiedTripSearchV2Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<UnifiedSearchResult | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    timeOfDay: [],
    busTypes: [],
    carriers: [],
  });
  const [sortBy, setSortBy] = useState<SortType>('departure');
  const [selectedDate, setSelectedDate] = useState<string>(
    autoSearchParams?.data || new Date().toISOString().split('T')[0]
  );
  const [showSearchForm, setShowSearchForm] = useState<boolean>(false);
  
  const [breadcrumbOrigin, setBreadcrumbOrigin] = useState<string>('');
  const [breadcrumbDestination, setBreadcrumbDestination] = useState<string>('');

  useEffect(() => {
    if (autoSearchParams) {
      handleSearch({
        departureCity: autoSearchParams.origem,
        arrivalCity: autoSearchParams.destino,
        departureDate: autoSearchParams.data,
        passengers: 1
      });
    }
  }, [autoSearchParams]);

  useEffect(() => {
    const fetchBreadcrumbNames = async () => {
      if (!searchResult) return;

      try {
        const origensResponse = await fetch('/api/viop/origens?q=');
        const origensData: ViopCitiesResponse = await origensResponse.json();
        
        if (origensData.ok && origensData.items) {
          const originCity: ViopCity | undefined = origensData.items.find(
            (city: ViopCity) => city.id === searchResult.searchParams.departureCity
          );
          if (originCity) {
            setBreadcrumbOrigin(formatViopCity(originCity.nome));
          }
        }

        const destinosResponse = await fetch(
          `/api/viop/destinos?origemId=${searchResult.searchParams.departureCity}&q=`
        );
        const destinosData: ViopCitiesResponse = await destinosResponse.json();
        
        if (destinosData.ok && destinosData.items) {
          const destCity: ViopCity | undefined = destinosData.items.find(
            (city: ViopCity) => city.id === searchResult.searchParams.arrivalCity
          );
          if (destCity) {
            setBreadcrumbDestination(formatViopCity(destCity.nome));
          }
        }
      } catch (error) {
        console.error('Erro ao buscar nomes para breadcrumb:', error);
      }
    };

    fetchBreadcrumbNames();
  }, [searchResult]);

  const handleSearch = async (params: {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    passengers: number;
  }): Promise<void> => {
    setLoading(true);
    setShowSearchForm(false);
    try {
      if (viopOnly) {
        const departureParts = params.departureCity.split('|');
        const arrivalParts = params.arrivalCity.split('|');

        const isViopId = (id: string): boolean => /^\d+$/.test(id);
        const departureViopId = departureParts.find(isViopId) || params.departureCity;
        const arrivalViopId = arrivalParts.find(isViopId) || params.arrivalCity;

        if (!departureViopId || !arrivalViopId) {
          alert('Esta rota não está disponível. Por favor, selecione outra cidade.');
          setLoading(false);
          return;
        }

        const viopAdapter = new ViopAdapter();
        const trips = await viopAdapter.searchTrips({
          departureCity: departureViopId,
          arrivalCity: arrivalViopId,
          departureDate: params.departureDate,
          passengers: params.passengers,
        });

        const tripsOrdenados = trips.sort((a, b) => {
          const horarioA = a.departureTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || '00:00';
          const horarioB = b.departureTime?.split('T')[1]?.split(':').slice(0, 2).join(':') || '00:00';
          const [horaA, minA] = horarioA.split(':').map(Number);
          const [horaB, minB] = horarioB.split(':').map(Number);
          return (horaA * 60 + minA) - (horaB * 60 + minB);
        });

        const result: UnifiedSearchResult = {
          trips: tripsOrdenados,
          searchParams: params,
          providers: {
            distribusion: { success: false, count: 0 },
            viop: { success: true, count: tripsOrdenados.length },
          },
        };

        setSearchResult(result);
        setSelectedDate(params.departureDate);
      } else {
        const response = await fetch('/api/search/unified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (!response.ok) throw new Error('Erro ao buscar viagens');

        const data: UnifiedSearchResult = await response.json();
        setSearchResult(data);
        setSelectedDate(params.departureDate);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      alert('Erro ao buscar viagens. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleTripSelect = (trip: UnifiedTrip): void => {
    if (trip.provider === 'viop') {
      if (trip.bookingUrl && trip.bookingUrl.startsWith('/')) {
        window.location.assign(trip.bookingUrl);
        return;
      }

      const servico = trip.id.replace(/^viop-conexao-/, '').replace(/^viop-/, '').split('-')[0];
      const origem = trip.departureCityCode || trip.departureCity;
      const destino = trip.arrivalCityCode || trip.arrivalCity;
      const dataISO = trip.departureTime;
      const data = dataISO ? dataISO.slice(0, 10) : '';

      const params = new URLSearchParams();
      if (servico) params.set('servico', servico);
      if (origem) params.set('origem', origem);
      if (destino) params.set('destino', destino);
      if (data) params.set('data', data);

      //Detectar se é conexão
      if (trip.conexao) {
        window.location.assign(`/buscar-viop/conexao?${params.toString()}`);
      } else {
        window.location.assign(`/buscar-viop/assentos?${params.toString()}`);
      }
      return;
    }

    window.open(trip.bookingUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDateChange = (newDate: string) => {
    if (searchResult?.searchParams) {
      handleSearch({
        ...searchResult.searchParams,
        departureDate: newDate
      });
    }
  };

  const getFilteredAndSortedTrips = (): UnifiedTrip[] => {
    if (!searchResult) return [];
    let filtered = applyFilters(searchResult.trips, filters);
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'duration':
          return a.duration - b.duration;
        case 'departure':
        default:
          const timeA = a.departureTime.split('T')[1] || '';
          const timeB = b.departureTime.split('T')[1] || '';
          return timeA.localeCompare(timeB);
      }
    });
    return filtered;
  };

  const filteredTrips = getFilteredAndSortedTrips();

  // Formatar data para exibição
  const dataFormatada = selectedDate 
    ? format(new Date(selectedDate + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })
    : '';

  return (
    <div className="min-h-screen">
      
      {/* 🔥 HEADER COMPACTO MOBILE (igual ClickBus) */}
      {searchResult && (
        <div className="md:hidden sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-lg">
          <div className="px-4 py-3">
            {/* Rota */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-bold flex-1 min-w-0">
                <span className="truncate">{breadcrumbOrigin || searchResult.searchParams.departureCity}</span>
                <RefreshCw className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{breadcrumbDestination || searchResult.searchParams.arrivalCity}</span>
              </div>
            </div>

            {/* Data + Alterar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="capitalize">{dataFormatada}</span>
              </div>
              <button
                onClick={() => setShowSearchForm(!showSearchForm)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-semibold"
              >
                <Calendar className="w-3 h-3" />
                Alterar origem e destino
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Breadcrumb Desktop */}
        {searchResult && (
          <div className="hidden md:block py-4 text-sm text-gray-600">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="hover:text-blue-600 cursor-pointer">Passagens de ônibus</span>
              <ChevronRight className="w-4 h-4" />
              <span className="hover:text-blue-600 cursor-pointer">
                {breadcrumbOrigin || searchResult.searchParams.departureCity}
              </span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-semibold text-gray-900">
                {breadcrumbDestination || searchResult.searchParams.arrivalCity}
              </span>
            </div>
          </div>
        )}

        {/* Barra de Busca - Desktop sempre visível / Mobile somente se showSearchForm */}
        {searchResult && (
          <div className={`${showSearchForm ? 'block' : 'hidden'} md:block`}>
            <SearchBar
              initialOrigin={searchResult.searchParams.departureCity}
              initialDestination={searchResult.searchParams.arrivalCity}
              initialDate={selectedDate}
              onSearch={(params: { origin: string; destination: string; date: string }) => handleSearch({
                departureCity: params.origin,
                arrivalCity: params.destination,
                departureDate: params.date,
                passengers: 1
              })}
            />
          </div>
        )}

        {/* Seletor de Dias */}
        {searchResult && !showSearchForm && (
          <div className="md:mt-4">
            <DaySelector
              selectedDate={selectedDate}
              onDateSelect={handleDateChange}
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center mt-4">
            <div className="max-w-md mx-auto">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Buscando viagens...
              </h3>
              <p className="text-gray-600 text-sm">
                Aguarde enquanto encontramos as melhores opções
              </p>
            </div>
          </div>
        )}

        {/* Resultados */}
        {searchResult && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mt-4">
            {/* Sidebar Desktop */}
            <div className="hidden lg:block">
              <FilterSidebar
                trips={searchResult.trips}
                onFilterChange={setFilters}
              />
            </div>

            {/* Lista de Resultados */}
            <div>
              {/* Header: Ordenação + Contagem */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="text-sm">
                    <span className="font-bold text-gray-900">
                      {filteredTrips.length} {filteredTrips.length === 1 ? 'viagem' : 'viagens'}
                    </span>
                    {filteredTrips.length !== searchResult.trips.length && (
                      <span className="text-gray-600 ml-1">
                        (de {searchResult.trips.length} no total)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Ordenar por:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortType)}
                      className="text-sm font-semibold text-blue-600 border-2 border-gray-200 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    >
                      <option value="departure">Horário de saída</option>
                      <option value="price">Menor preço</option>
                      <option value="duration">Menor duração</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lista de Viagens */}
              {filteredTrips.length > 0 ? (
                <div className="space-y-4">
                  {filteredTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      onSelect={handleTripSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <SearchX className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">
                      Nenhuma viagem encontrada
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Tente ajustar os filtros ou busque outra data
                    </p>
                    <button
                      onClick={() => setFilters({ timeOfDay: [], busTypes: [], carriers: [] })}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Limpar todos os filtros
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estado Vazio */}
        {!searchResult && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <SearchX className="w-12 h-12 text-white" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
              <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-600 mb-3">
                Faça sua busca
              </h3>
              <p className="text-gray-600">
                Use o formulário acima para encontrar passagens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}