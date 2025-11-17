// apps/web/src/app/buscar-teste/page.tsx
'use client'

import { UnifiedTripSearchV2 } from '@/components/UnifiedTripSearchV2';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bus, Sparkles } from 'lucide-react';

export default function BuscarTestePage() {
  const searchParams = useSearchParams();
  const [autoSearch, setAutoSearch] = useState(false);

  useEffect(() => {
    const origem = searchParams.get('origem');
    const destino = searchParams.get('destino');
    const data = searchParams.get('data');

    if (origem && destino && data) {
      setAutoSearch(true);
    }
  }, [searchParams]);

  const extraProps: { autoSearchParams?: {
    origem: string;
    destino: string;
    data: string;
    tipo: 'oneway' | 'roundtrip';
    dataVolta?: string;
  } } = autoSearch ? {
    autoSearchParams: {
      origem: searchParams.get('origem') || '',
      destino: searchParams.get('destino') || '',
      data: searchParams.get('data') || '',
      tipo: (searchParams.get('tipo') as 'oneway' | 'roundtrip') || 'oneway',
      dataVolta: searchParams.get('dataVolta') || undefined
    }
  } : {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Header Premium */}
      <div className="bg-gradient-to-r from-blue-600 to-sky-600 text-white py-8 md:py-12 shadow-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
              <Bus className="w-10 h-10 md:w-12 md:h-12 text-white" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 text-yellow-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white">
                Busca de Passagens
              </h1>
              <p className="text-blue-100 text-sm md:text-lg mt-1">
                Encontre as melhores rotas e horários
              </p>
            </div>
          </div>
          
          {/* Badges de Benefícios no Header */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <span className="text-xl">💎</span>
              <span className="font-semibold text-white text-sm">Melhores Preços</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <span className="text-xl">⚡</span>
              <span className="font-semibold text-white text-sm">Reserva Instantânea</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <span className="text-xl">🔒</span>
              <span className="font-semibold text-white text-sm">100% Seguro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 py-8">
        <UnifiedTripSearchV2 
          viopOnly={true}
          {...extraProps}
        />
      </div>
    </div>
  );
}