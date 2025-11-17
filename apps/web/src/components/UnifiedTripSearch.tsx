'use client';

import { useState, useEffect } from 'react';
import { UnifiedSearchForm } from './UnifiedSearchForm';
import { TripCard } from './TripCard';
import { UnifiedTrip, UnifiedSearchResult } from '@/types/unified-trip';
import { Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

type SortOption = 'price' | 'departure' | 'duration' | 'arrival';

export function UnifiedTripSearch() {
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<UnifiedSearchResult | null>(null);
  const [filteredTrips, setFilteredTrips] = useState<UnifiedTrip[]>([]);
  
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedCarriers, setSelectedCarriers] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  
  const [sortBy, setSortBy] = useState<SortOption>('departure');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSearch = async (params: {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    passengers: number;
  }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/search/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar viagens');
      }

      const data: UnifiedSearchResult = await response.json();
      setSearchResult(data);
      setFilteredTrips(data.trips);
      
      setMaxPrice('');
      setSelectedCarriers([]);
      setSelectedProviders([]);
    } catch (error) {
      console.error('Erro na busca:', error);
      alert('Erro ao buscar viagens. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleTripSelect = (trip: UnifiedTrip) => {
    window.open(trip.bookingUrl, '_blank');
  };

  const applyFiltersAndSort = () => {
    if (!searchResult) return;

    let filtered = [...searchResult.trips];

    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : null;
    if (maxPriceNum !== null && maxPriceNum > 0) {
      filtered = filtered.filter((trip) => trip.price <= maxPriceNum);
    }

    if (selectedCarriers.length > 0) {
      filtered = filtered.filter((trip) =>
        selectedCarriers.includes(trip.carrier)
      );
    }

    if (selectedProviders.length > 0) {
      filtered = filtered.filter((trip) =>
        selectedProviders.includes(trip.provider)
      );
    }

    filtered.sort((a, b) => {
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

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTrips(filtered);
  };

  useEffect(() => {
    applyFiltersAndSort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResult, maxPrice, selectedCarriers, selectedProviders, sortBy, sortOrder]);

  const availableCarriers = searchResult
    ? Array.from(new Set(searchResult.trips.map((trip) => trip.carrier)))
    : [];

  const toggleCarrier = (carrier: string) => {
    setSelectedCarriers((prev) =>
      prev.includes(carrier)
        ? prev.filter((c) => c !== carrier)
        : [...prev, carrier]
    );
  };

  const toggleProvider = (provider: string) => {
    setSelectedProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider]
    );
  };

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Good Trip - Busca Unificada
          </h1>
          <p className="text-gray-600">
            Encontre as melhores passagens de ônibus em um só lugar
          </p>
        </div>

        <div className="mb-8">
          <UnifiedSearchForm onSearch={handleSearch} loading={loading} />
        </div>

        {searchResult && (
          <div>
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {filteredTrips.length} viagens encontradas
                  </h2>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    <span>
                      Distribusion: {searchResult.providers.distribusion.count} viagens
                    </span>
                    <span>VIOP: {searchResult.providers.viop.count} viagens</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    Filtros
                  </button>

                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="px-4 py-2 bg-gray-100 rounded-lg border-0"
                  >
                    <option value="departure">Horário de partida</option>
                    <option value="price">Preço</option>
                    <option value="duration">Duração</option>
                    <option value="arrival">Horário de chegada</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preço máximo
                      </label>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Sem limite"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Empresas
                      </label>
                      <div className="space-y-2">
                        {availableCarriers.map((carrier) => (
                          <label
                            key={carrier}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCarriers.includes(carrier)}
                              onChange={() => toggleCarrier(carrier)}
                              className="rounded"
                            />
                            <span className="text-sm">{carrier}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Provedores
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedProviders.includes('distribusion')}
                            onChange={() => toggleProvider('distribusion')}
                            className="rounded"
                          />
                          <span className="text-sm">Distribusion</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedProviders.includes('viop')}
                            onChange={() => toggleProvider('viop')}
                            className="rounded"
                          />
                          <span className="text-sm">VIOP</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 text-lg">
                  Nenhuma viagem encontrada com os filtros aplicados
                </p>
              </div>
            )}
          </div>
        )}

        {!searchResult && !loading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <SlidersHorizontal className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Faça sua primeira busca
            </h3>
            <p className="text-gray-600">
              Selecione origem, destino e data para encontrar as melhores passagens
            </p>
          </div>
        )}
      </div>
    </div>
  );
}