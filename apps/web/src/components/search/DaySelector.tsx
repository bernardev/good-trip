// apps/web/src/app/components/search/DaySelector.tsx
'use client';

import { addDays, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DaySelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onDateSelect: (date: string) => void;
  daysToShow?: number;
}

export function DaySelector({ 
  selectedDate, 
  onDateSelect,
  daysToShow = 7 
}: DaySelectorProps) {
  const selected = new Date(selectedDate + 'T00:00:00');
  const today = new Date();
  
  // Gerar array de dias (3 antes, dia selecionado, 3 depois)
  const days = Array.from({ length: daysToShow }, (_, i) => {
    const offset = i - Math.floor(daysToShow / 2);
    return addDays(selected, offset);
  }).filter(day => day >= today); // Não mostrar datas passadas

  const handlePrevDay = () => {
    const prevDay = addDays(selected, -1);
    if (prevDay >= today) {
      onDateSelect(format(prevDay, 'yyyy-MM-dd'));
    }
  };

  const handleNextDay = () => {
    const nextDay = addDays(selected, 1);
    onDateSelect(format(nextDay, 'yyyy-MM-dd'));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
      <div className="flex items-center gap-2">
        {/* Botão Anterior */}
        <button
          onClick={handlePrevDay}
          disabled={isSameDay(selected, today)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Dia anterior"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* Lista de Dias */}
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {days.map((day) => {
              const isSelected = isSameDay(day, selected);
              const dateStr = format(day, 'yyyy-MM-dd');
              
              return (
                <button
                  key={dateStr}
                  onClick={() => onDateSelect(dateStr)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all min-w-[90px] ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-lg scale-105'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="text-xs font-semibold uppercase">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`text-lg font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="text-xs capitalize">
                    {format(day, 'MMM', { locale: ptBR })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botão Próximo */}
        <button
          onClick={handleNextDay}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          title="Próximo dia"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}