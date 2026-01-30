// apps/web/src/app/components/search/SearchBar.tsx
'use client';

import { useState, useEffect } from 'react';
import { MapPin, Calendar, ArrowLeftRight, Search, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import type { ViopCitiesResponse, ViopCity } from '@/types/unified-trip';

interface SearchBarProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialDate?: string;
  onSearch: (params: {
    origin: string;
    destination: string;
    date: string;
  }) => void;
}

interface CityOption {
  nome: string;
  id: string;
}

// Função para formatar nome da cidade
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

function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function SearchBar({
  initialOrigin = '',
  initialDestination = '',
  initialDate = format(new Date(), 'yyyy-MM-dd'),
  onSearch
}: SearchBarProps) {
  // IDs das cidades selecionadas
  const [departureCity, setDepartureCity] = useState(initialOrigin);
  const [arrivalCity, setArrivalCity] = useState(initialDestination);
  
  // Termos de busca (texto digitado)
  const [departureTerm, setDepartureTerm] = useState('');
  const [arrivalTerm, setArrivalTerm] = useState('');
  
  // Cache completo de cidades
  const [allDepartureCities, setAllDepartureCities] = useState<CityOption[]>([]);
  const [allArrivalCities, setAllArrivalCities] = useState<CityOption[]>([]);
  
  // Sugestões filtradas
  const [departureSuggestions, setDepartureSuggestions] = useState<CityOption[]>([]);
  const [arrivalSuggestions, setArrivalSuggestions] = useState<CityOption[]>([]);
  
  // Controle de dropdowns
  const [showDepartureDropdown, setShowDepartureDropdown] = useState(false);
  const [showArrivalDropdown, setShowArrivalDropdown] = useState(false);
  
  const [date, setDate] = useState(initialDate);

  // Buscar todas as origens ao montar
  useEffect(() => {
    const fetchAllOrigins = async () => {
      try {
        const response = await fetch('/api/viop/origens?q=');
        const data: ViopCitiesResponse = await response.json();
        
        if (data.ok && data.items) {
          const formatted = data.items.map((city: ViopCity) => ({
            id: city.id,
            nome: formatViopCity(city.nome)
          }));
          setAllDepartureCities(formatted);
        }
      } catch (error) {
        console.error('Erro ao buscar todas as origens:', error);
      }
    };

    fetchAllOrigins();
  }, []);

  // Buscar nome da cidade de origem inicial
  useEffect(() => {
    if (initialOrigin && allDepartureCities.length > 0) {
      const city = allDepartureCities.find((c: CityOption) => c.id === initialOrigin);
      if (city) {
        setDepartureTerm(city.nome);
      }
    }
  }, [initialOrigin, allDepartureCities]);

  // Filtrar sugestões de origem
  useEffect(() => {
    if (allDepartureCities.length === 0) return;

    if (!departureTerm || departureTerm.trim() === '') {
      setDepartureSuggestions(allDepartureCities);
    } else {
      const normalized = normalizeForSearch(departureTerm);
      const filtered = allDepartureCities.filter((city: CityOption) => 
        normalizeForSearch(city.nome).includes(normalized)
      );
      setDepartureSuggestions(filtered);
    }
  }, [departureTerm, allDepartureCities]);

  // Buscar destinos quando origem mudar
  useEffect(() => {
    if (!departureCity) {
      setAllArrivalCities([]);
      setArrivalSuggestions([]);
      return;
    }

    const fetchDestinations = async () => {
      try {
        const response = await fetch(
          `/api/viop/destinos?origemId=${encodeURIComponent(departureCity)}&q=`
        );
        const data: ViopCitiesResponse = await response.json();
        
        if (data.ok && data.items) {
          const formatted = data.items.map((city: ViopCity) => ({
            id: city.id,
            nome: formatViopCity(city.nome)
          }));
          setAllArrivalCities(formatted);
        }
      } catch (error) {
        console.error('Erro ao buscar destinos:', error);
      }
    };

    fetchDestinations();
  }, [departureCity]);

  // Buscar nome da cidade de destino inicial
  useEffect(() => {
    if (initialDestination && allArrivalCities.length > 0) {
      const city = allArrivalCities.find((c: CityOption) => c.id === initialDestination);
      if (city) {
        setArrivalTerm(city.nome);
      }
    }
  }, [initialDestination, allArrivalCities]);

  // Filtrar sugestões de destino
  useEffect(() => {
    if (allArrivalCities.length === 0) return;

    if (!arrivalTerm || arrivalTerm.trim() === '') {
      setArrivalSuggestions(allArrivalCities);
    } else {
      const normalized = normalizeForSearch(arrivalTerm);
      const filtered = allArrivalCities.filter((city: CityOption) => 
        normalizeForSearch(city.nome).includes(normalized)
      );
      setArrivalSuggestions(filtered);
    }
  }, [arrivalTerm, allArrivalCities]);

  const selectDeparture = (city: CityOption) => {
    setDepartureCity(city.id);
    setDepartureTerm(city.nome);
    setShowDepartureDropdown(false);
    setArrivalCity('');
    setArrivalTerm('');
  };

  const selectArrival = (city: CityOption) => {
    setArrivalCity(city.id);
    setArrivalTerm(city.nome);
    setShowArrivalDropdown(false);
  };

  const handleSwap = () => {
    const tempId = departureCity;
    setDepartureCity(arrivalCity);
    setArrivalCity(tempId);
    
    const tempName = departureTerm;
    setDepartureTerm(arrivalTerm);
    setArrivalTerm(tempName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (departureCity && arrivalCity && date) {
      onSearch({ origin: departureCity, destination: arrivalCity, date });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 md:gap-4">
        {/* Origem */}
        <div className="flex-1 relative">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Origem
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 z-10" />
            <input
              type="text"
              value={departureTerm}
              onChange={(e) => {
                setDepartureTerm(e.target.value);
                setShowDepartureDropdown(true);
              }}
              onFocus={() => setShowDepartureDropdown(true)}
              onBlur={() => setTimeout(() => setShowDepartureDropdown(false), 200)}
              placeholder="De onde você sai?"
              className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium"
            />
          </div>
          {showDepartureDropdown && departureSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-200 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
              {departureSuggestions.map((city: CityOption, index: number) => (
                <button
                  key={`${city.id}-${index}`}
                  type="button"
                  onClick={() => selectDeparture(city)}
                  className="w-full px-3 py-2.5 text-left hover:bg-blue-50 transition-all border-b border-gray-100 last:border-0 flex items-center justify-between group text-sm"
                >
                  <span className="font-semibold text-gray-800 group-hover:text-blue-600">
                    {city.nome}
                  </span>
                  <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botão Swap */}
        <div className="flex md:block justify-center md:mt-6">
          <button
            type="button"
            onClick={handleSwap}
            disabled={!departureCity || !arrivalCity}
            className="p-2.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Trocar origem e destino"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
        </div>

        {/* Destino */}
        <div className="flex-1 relative">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Destino
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500 z-10" />
            <input
              type="text"
              value={arrivalTerm}
              onChange={(e) => {
                setArrivalTerm(e.target.value);
                setShowArrivalDropdown(true);
              }}
              onFocus={() => setShowArrivalDropdown(true)}
              onBlur={() => setTimeout(() => setShowArrivalDropdown(false), 200)}
              placeholder={departureCity ? 'Para onde você vai?' : 'Selecione origem primeiro'}
              disabled={!departureCity}
              className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          {showArrivalDropdown && arrivalSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-200 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
              {arrivalSuggestions.map((city: CityOption, index: number) => (
                <button
                  key={`${city.id}-${index}`}
                  type="button"
                  onClick={() => selectArrival(city)}
                  className="w-full px-3 py-2.5 text-left hover:bg-sky-50 transition-all border-b border-gray-100 last:border-0 flex items-center justify-between group text-sm"
                >
                  <span className="font-semibold text-gray-800 group-hover:text-sky-600">
                    {city.nome}
                  </span>
                  <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Data */}
        <div className="flex-1 relative">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Data de ida
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Botão Buscar */}
        <div className="md:mt-6">
          <button
            type="submit"
            disabled={!departureCity || !arrivalCity || !date}
            className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>
      </form>
    </div>
  );
}