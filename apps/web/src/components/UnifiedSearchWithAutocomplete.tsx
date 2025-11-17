// apps/web/src/app/components/search/UnifiedSearchWithAutocomplete.tsx
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { Search, MapPin, Calendar, Users, Loader2 } from 'lucide-react';
import { ViopCitiesResponse } from '@/types/unified-trip';

interface UnifiedSearchProps {
  onSearch: (params: {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    passengers: number;
  }) => void;
  loading?: boolean;
  viopOnly?: boolean;
  initialValues?: {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
  };
}

interface CityOption {
  nome: string;
  id: string;
}

export function UnifiedSearchWithAutocomplete({ 
  onSearch, 
  loading, 
  viopOnly = false,
  initialValues
}: UnifiedSearchProps) {
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  
  const [departureDate, setDepartureDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const [departureTerm, setDepartureTerm] = useState('');
  const [arrivalTerm, setArrivalTerm] = useState('');

  const [allDepartureCities, setAllDepartureCities] = useState<CityOption[]>([]);
  const [allArrivalCities, setAllArrivalCities] = useState<CityOption[]>([]);

  const [departureSuggestions, setDepartureSuggestions] = useState<CityOption[]>([]);
  const [arrivalSuggestions, setArrivalSuggestions] = useState<CityOption[]>([]);

  const [showDepartureDropdown, setShowDepartureDropdown] = useState(false);
  const [showArrivalDropdown, setShowArrivalDropdown] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const minDate = new Date().toISOString().split('T')[0];

  const parseViopCityName = (name: string): { cidade: string; estado: string } => {
    const cleaned = name.trim().toUpperCase();
    const stateMatch = cleaned.match(/[A-Z]{2}$/);
    const estado = stateMatch ? stateMatch[0] : '';
    const cidadeMatch = cleaned.match(/^([^-]+)/);
    const cidadeRaw = cidadeMatch ? cidadeMatch[1].trim() : cleaned;
    const cidade = cidadeRaw
      .toLowerCase()
      .split(' ')
      .map((word) => (['de', 'do', 'da', 'dos', 'das', 'e'].includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
      .join(' ')
      .replace(/\bSao\b/g, 'São');
    return { cidade, estado };
  };

  const formatViopCity = (nome: string): string => {
    const { cidade, estado } = parseViopCityName(nome);
    return estado ? `${cidade}/${estado}` : cidade;
  };

  const normalizeForSearch = (text: string): string => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  const fetchCityName = async (cityId: string, type: 'departure' | 'arrival') => {
    try {
      const response = await fetch('/api/viop/origens?q=');
      const data: ViopCitiesResponse = await response.json();
      
      if (data.ok && data.items) {
        const city = data.items.find(c => c.id === cityId);
        if (city) {
          const formatted = formatViopCity(city.nome);
          if (type === 'departure') {
            setDepartureTerm(formatted);
          } else {
            setArrivalTerm(formatted);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar nome da cidade:', error);
    }
  };

  useEffect(() => {
    if (initialValues) {
      setDepartureCity(initialValues.departureCity);
      setArrivalCity(initialValues.arrivalCity);
      setDepartureDate(initialValues.departureDate);
      
      fetchCityName(initialValues.departureCity, 'departure');
      fetchCityName(initialValues.arrivalCity, 'arrival');
    }
  }, [initialValues]);

  useEffect(() => {
    const fetchAllOrigins = async () => {
      try {
        const response = await fetch('/api/viop/origens?q=');
        const data: ViopCitiesResponse = await response.json();
        
        if (data.ok && data.items) {
          const formatted = data.items.map(city => ({
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

  useEffect(() => {
    if (allDepartureCities.length === 0) return;

    if (!departureTerm || departureTerm.trim() === '') {
      setDepartureSuggestions(allDepartureCities);
    } else {
      const normalized = normalizeForSearch(departureTerm);
      const filtered = allDepartureCities.filter(city => 
        normalizeForSearch(city.nome).includes(normalized)
      );
      setDepartureSuggestions(filtered);
    }
  }, [departureTerm, allDepartureCities]);

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
          const formatted = data.items.map(city => ({
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

  useEffect(() => {
    if (allArrivalCities.length === 0) return;

    if (!arrivalTerm || arrivalTerm.trim() === '') {
      setArrivalSuggestions(allArrivalCities);
    } else {
      const normalized = normalizeForSearch(arrivalTerm);
      const filtered = allArrivalCities.filter(city => 
        normalizeForSearch(city.nome).includes(normalized)
      );
      setArrivalSuggestions(filtered);
    }
  }, [arrivalTerm, allArrivalCities]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!departureCity || !arrivalCity || !departureDate) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    onSearch({
      departureCity,
      arrivalCity,
      departureDate,
      passengers,
    });
  };

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

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Origem */}
        <div className="relative">
          <label className="block text-xs font-bold text-blue-700 mb-2 ml-1">
            <MapPin className="inline w-4 h-4 mr-1" />
            Origem
          </label>
          <input
            type="text"
            value={departureTerm}
            onChange={(e) => {
              setDepartureTerm(e.target.value);
              setShowDepartureDropdown(true);
            }}
            onFocus={() => setShowDepartureDropdown(true)}
            onBlur={() => setTimeout(() => setShowDepartureDropdown(false), 200)}
            placeholder="Digite a cidade"
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white hover:border-blue-300 font-medium text-gray-800"
            required
          />
          {showDepartureDropdown && departureSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-60 overflow-auto">
              {departureSuggestions.map((city, index) => (
                <button
                  key={`${city.id}-${index}`}
                  type="button"
                  onClick={() => selectDeparture(city)}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between transition-all border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium text-gray-800">{city.nome}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Destino */}
        <div className="relative">
          <label className="block text-xs font-bold text-blue-700 mb-2 ml-1">
            <MapPin className="inline w-4 h-4 mr-1" />
            Destino
          </label>
          <input
            type="text"
            value={arrivalTerm}
            onChange={(e) => {
              setArrivalTerm(e.target.value);
              setShowArrivalDropdown(true);
            }}
            onFocus={() => setShowArrivalDropdown(true)}
            onBlur={() => setTimeout(() => setShowArrivalDropdown(false), 200)}
            placeholder={departureCity ? 'Digite a cidade' : 'Selecione origem primeiro'}
            disabled={!departureCity}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all bg-white hover:border-sky-300 disabled:bg-gray-100 font-medium text-gray-800"
            required
          />
          {showArrivalDropdown && arrivalSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-60 overflow-auto">
              {arrivalSuggestions.map((city, index) => (
                <button
                  key={`${city.id}-${index}`}
                  type="button"
                  onClick={() => selectArrival(city)}
                  className="w-full text-left px-4 py-2 hover:bg-sky-50 flex items-center justify-between transition-all border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium text-gray-800">{city.nome}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Data */}
        <div>
          <label className="block text-xs font-bold text-blue-700 mb-2 ml-1">
            <Calendar className="inline w-4 h-4 mr-1" />
            Data
          </label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            min={minDate}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white hover:border-blue-300 font-medium text-gray-800"
            required
          />
        </div>

        {/* Passageiros */}
        <div>
          <label className="block text-xs font-bold text-blue-700 mb-2 ml-1">
            <Users className="inline w-4 h-4 mr-1" />
            Passageiros
          </label>
          <select
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white hover:border-blue-300 font-medium text-gray-800"
          >
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'passageiro' : 'passageiros'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botão de busca */}
      <button
        type="submit"
        disabled={loading || !departureCity || !arrivalCity || !departureDate}
        className="w-full bg-gradient-to-r from-blue-600 to-sky-600 hover:from-sky-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Buscando...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Buscar Passagens
          </>
        )}
      </button>
    </form>
  );
}