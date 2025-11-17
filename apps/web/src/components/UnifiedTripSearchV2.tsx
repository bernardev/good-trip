// apps/web/src/app/components/search/UnifiedTripSearchV2.tsx
'use client';

import { useState, useEffect } from 'react';
import { UnifiedSearchWithAutocomplete } from './UnifiedSearchWithAutocomplete';
import { TripCard } from './TripCard';
import type { UnifiedTrip, UnifiedSearchResult } from '@/types/unified-trip';
import { SlidersHorizontal, Package, Sparkles, SearchX, Loader2 } from 'lucide-react';
import { ViopAdapter } from '@/services/viop-adapter';

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

export function UnifiedTripSearchV2({ 
  viopOnly = false,
  autoSearchParams
}: UnifiedTripSearchV2Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<UnifiedSearchResult | null>(null);

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

  const handleSearch = async (params: {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    passengers: number;
  }): Promise<void> => {
    setLoading(true);
    try {
      if (viopOnly) {
        console.log('🟢 Modo de busca ativado');

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

        const result: UnifiedSearchResult = {
          trips,
          searchParams: params,
          providers: {
            distribusion: {
              success: false,
              count: 0,
            },
            viop: {
              success: true,
              count: trips.length,
            },
          },
        };

        setSearchResult(result);
      } else {
        const response = await fetch('/api/search/unified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (!response.ok) throw new Error('Erro ao buscar viagens');

        const data: UnifiedSearchResult = await response.json();
        setSearchResult(data);
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

      const servico = trip.id.replace(/^viop-/, '');
      const origem = trip.departureCityCode || trip.departureCity;
      const destino = trip.arrivalCityCode || trip.arrivalCity;
      const dataISO = trip.departureTime;
      const data = dataISO ? dataISO.slice(0, 10) : '';

      const params = new URLSearchParams();
      if (servico) params.set('servico', servico);
      if (origem) params.set('origem', origem);
      if (destino) params.set('destino', destino);
      if (data) params.set('data', data);

      window.location.assign(`/buscar-viop/assentos?${params.toString()}`);
      return;
    }

    window.open(trip.bookingUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 py-6 md:py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Formulário de Busca com Card Premium */}
        <div className="relative bg-white rounded-[2rem] shadow-2xl p-6 md:p-8 mb-8">
          {/* Gradiente de fundo sutil */}
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blue-50 via-white to-sky-50 -z-10" />
          
          <UnifiedSearchWithAutocomplete 
            onSearch={handleSearch} 
            loading={loading}
            initialValues={autoSearchParams ? {
              departureCity: autoSearchParams.origem,
              arrivalCity: autoSearchParams.destino,
              departureDate: autoSearchParams.data
            } : undefined}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-[2rem] shadow-2xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-sky-600 rounded-3xl flex items-center justify-center shadow-xl">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Buscando viagens...
              </h3>
              <p className="text-gray-600">
                Aguarde enquanto encontramos as melhores opções para você
              </p>
            </div>
          </div>
        )}

        {/* Resultados */}
        {searchResult && !loading && (
          <div className="space-y-6">
            {/* Card de Resumo dos Resultados - PREMIUM */}
            <div className="relative bg-gradient-to-r from-blue-600 to-sky-600 rounded-[2rem] shadow-2xl p-6 md:p-8 overflow-hidden">
              {/* Efeito de brilho animado */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-sky-500/20 to-blue-500/20 animate-pulse" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                    <Package className="w-10 h-10 md:w-12 md:h-12 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-white">
                      {searchResult.trips.length} {searchResult.trips.length === 1 ? 'Viagem' : 'Viagens'}
                    </h2>
                    <p className="text-blue-100 text-sm md:text-base mt-1">
                      {searchResult.trips.length === 0 
                        ? 'Nenhum resultado encontrado' 
                        : 'Selecione a melhor opção para você'}
                    </p>
                  </div>
                </div>
                
                {/* Badge de contagem com efeito premium */}
                {searchResult.trips.length > 0 && (
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl border-2 border-white/30 shadow-lg">
                    <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                    <span className="font-black text-2xl text-white">{searchResult.trips.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de Viagens */}
            {searchResult.trips.length > 0 ? (
              <div className="space-y-4">
                {searchResult.trips.map((trip) => (
                  <div 
                    key={trip.id}
                    className="transform transition-all duration-300 hover:scale-[1.02]"
                  >
                    <TripCard trip={trip} onSelect={handleTripSelect} />
                  </div>
                ))}
              </div>
            ) : (
              /* Estado: Nenhuma viagem encontrada */
              <div className="bg-white rounded-[2rem] shadow-2xl p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="relative inline-block mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center shadow-xl">
                      <SearchX className="w-12 h-12 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-3">
                    Nenhuma viagem encontrada
                  </h3>
                  <p className="text-gray-600 text-lg mb-6">
                    Não encontramos passagens para esta rota e data.
                  </p>
                  
                  {/* Sugestões */}
                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-6 text-left">
                    <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                      Sugestões:
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>Tente outras datas próximas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>Verifique se digitou as cidades corretamente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>Busque por cidades próximas ao destino</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado Vazio (antes da busca) */}
        {!searchResult && !loading && (
          <div className="bg-white rounded-[2rem] shadow-2xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="relative inline-block mb-6">
                <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-sky-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:rotate-12 transition-transform duration-500">
                  <SlidersHorizontal className="w-14 h-14 text-white" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-10 h-10 text-yellow-400 animate-pulse" />
              </div>
              <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-600 mb-4">
                Faça sua primeira busca
              </h3>
              <p className="text-gray-600 text-lg mb-8">
                Preencha os campos acima para encontrar as melhores passagens de ônibus disponíveis
              </p>
              
              {/* Cards de Benefícios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-4 border-2 border-blue-100">
                  <div className="text-3xl mb-2">💎</div>
                  <div className="font-bold text-blue-900 text-sm">Melhores Preços</div>
                </div>
                <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-4 border-2 border-sky-100">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="font-bold text-sky-900 text-sm">Compra Rápida</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 border-2 border-yellow-100">
                  <div className="text-3xl mb-2">🔒</div>
                  <div className="font-bold text-yellow-900 text-sm">100% Seguro</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}