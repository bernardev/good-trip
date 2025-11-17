'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { CityWithProvider } from '@/types/unified-trip';

interface UnifiedSearchFormProps {
  onSearch: (params: {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    passengers: number;
  }) => void;
  loading?: boolean;
}

interface CitiesResponse {
  cities: CityWithProvider[];
  total: number;
}

export function UnifiedSearchForm({ onSearch, loading }: UnifiedSearchFormProps) {
  const [cities, setCities] = useState<CityWithProvider[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/cities');
      const data: CitiesResponse = await response.json();
      setCities(data.cities);
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!departureCity || !arrivalCity || !departureDate) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    onSearch({
      departureCity,
      arrivalCity,
      departureDate,
      passengers,
    });
  };

  const swapCities = () => {
    const temp = departureCity;
    setDepartureCity(arrivalCity);
    setArrivalCity(temp);
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Origem
          </label>
          <select
            value={departureCity}
            onChange={(e) => setDepartureCity(e.target.value)}
            disabled={loadingCities}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Selecione a origem</option>
            {cities.map((city) => (
              <option key={city.code} value={city.code}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden lg:flex items-end justify-center pb-3">
          <button
            type="button"
            onClick={swapCities}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Trocar origem e destino"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </button>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Destino
          </label>
          <select
            value={arrivalCity}
            onChange={(e) => setArrivalCity(e.target.value)}
            disabled={loadingCities}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Selecione o destino</option>
            {cities.map((city) => (
              <option key={city.code} value={city.code}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Data da viagem
          </label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            min={minDate}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline w-4 h-4 mr-1" />
            Passageiros
          </label>
          <select
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'passageiro' : 'passageiros'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={loading || loadingCities}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Buscando...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Buscar Passagens
            </>
          )}
        </button>
      </div>
    </form>
  );
}