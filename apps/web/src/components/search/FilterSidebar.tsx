// apps/web/src/app/components/search/FilterSidebar.tsx
'use client';

import { useState } from 'react';
import { Clock, Armchair, Building2, X } from 'lucide-react';
import type { UnifiedTrip } from '@/types/unified-trip';

interface FilterSidebarProps {
  trips: UnifiedTrip[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  timeOfDay: string[];
  busTypes: string[];
  carriers: string[];
}

const TIME_PERIODS = [
  { id: 'madrugada', label: 'Madrugada', range: '00:00 - 06:00'},
  { id: 'manha', label: 'Manhã', range: '06:00 - 12:00' },
  { id: 'tarde', label: 'Tarde', range: '12:00 - 18:00'},
  { id: 'noite', label: 'Noite', range: '18:00 - 00:00'},
];

export function FilterSidebar({ trips, onFilterChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    timeOfDay: [],
    busTypes: [],
    carriers: [],
  });

  // Extrair tipos únicos de ônibus
  const busTypes = Array.from(
    new Set(trips.map(t => t.busType).filter((type): type is string => Boolean(type)))
  ).sort();

  // Extrair empresas únicas
  const carriers = Array.from(
    new Set(trips.map(t => t.carrier))
  ).sort();

  const toggleFilter = (
    category: keyof FilterState,
    value: string
  ) => {
    setFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      const newFilters = { ...prev, [category]: updated };
      onFilterChange(newFilters);
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    const emptyFilters: FilterState = {
      timeOfDay: [],
      busTypes: [],
      carriers: [],
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters =
    filters.timeOfDay.length > 0 ||
    filters.busTypes.length > 0 ||
    filters.carriers.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-black text-gray-900">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Horário de Saída */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-bold text-gray-900">Horário de saída</h4>
        </div>
        <div className="space-y-2">
          {TIME_PERIODS.map((period) => (
            <label
              key={period.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-all group"
            >
              <input
                type="checkbox"
                checked={filters.timeOfDay.includes(period.id)}
                onChange={() => toggleFilter('timeOfDay', period.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                    {period.label}
                  </span>
                </div>
                <div className="text-xs text-gray-500">{period.range}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Tipo de Ônibus */}
      {busTypes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Armchair className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-gray-900">Tipo de ônibus</h4>
          </div>
          <div className="space-y-2">
            {busTypes.map((type) => (
              <label
                key={type}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-all group"
              >
                <input
                  type="checkbox"
                  checked={filters.busTypes.includes(type)}
                  onChange={() => toggleFilter('busTypes', type)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                  {type}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Empresas */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-bold text-gray-900">Empresas</h4>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
          {carriers.map((carrier) => {
            const count = trips.filter(t => t.carrier === carrier).length;
            return (
              <label
                key={carrier}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-all group"
              >
                <input
                  type="checkbox"
                  checked={filters.carriers.includes(carrier)}
                  onChange={() => toggleFilter('carriers', carrier)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 block truncate">
                    {carrier}
                  </span>
                  <span className="text-xs text-gray-500">{count} {count === 1 ? 'viagem' : 'viagens'}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Helper para aplicar filtros
export function applyFilters(trips: UnifiedTrip[], filters: FilterState): UnifiedTrip[] {
  return trips.filter(trip => {
    // Filtro de horário
    if (filters.timeOfDay.length > 0) {
      const hour = parseInt(trip.departureTime.split('T')[1]?.split(':')[0] || '0');
      const matchesTime = filters.timeOfDay.some(period => {
        switch (period) {
          case 'madrugada': return hour >= 0 && hour < 6;
          case 'manha': return hour >= 6 && hour < 12;
          case 'tarde': return hour >= 12 && hour < 18;
          case 'noite': return hour >= 18 && hour < 24;
          default: return false;
        }
      });
      if (!matchesTime) return false;
    }

    // Filtro de tipo de ônibus
    if (filters.busTypes.length > 0) {
      if (!trip.busType || !filters.busTypes.includes(trip.busType)) {
        return false;
      }
    }

    // Filtro de empresas
    if (filters.carriers.length > 0) {
      if (!filters.carriers.includes(trip.carrier)) {
        return false;
      }
    }

    return true;
  });
}