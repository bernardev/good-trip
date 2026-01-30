// apps/web/src/app/buscar-teste/page.tsx
'use client'

import { UnifiedTripSearchV2 } from '@/components/UnifiedTripSearchV2';
import BackButton from '@/components/ui/BackButton'
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Bus, Sparkles, ShieldCheck, Zap, Gem } from 'lucide-react';

function BuscarTesteContent() {
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
      
      {/* HEADER COMPACTO - DESKTOP */}
      <div className="hidden md:block bg-gradient-to-r from-blue-600 to-sky-600 text-white py-8 md:py-12 shadow-xl">
        <div className="container mx-auto px-4">
          <div className="relative flex items-center justify-center gap-4 mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2">
              <BackButton fallbackUrl="/" label="Voltar" />
            </div>
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
          
          {/* Badges de Benefícios */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <Gem className="w-5 h-5 text-white" />
              <span className="font-semibold text-white text-sm">Melhores Preços</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <Zap className="w-5 h-5 text-white" />
              <span className="font-semibold text-white text-sm">Reserva Instantânea</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <ShieldCheck className="w-5 h-5 text-white" />
              <span className="font-semibold text-white text-sm">100% Seguro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-0 md:px-4 py-0 md:py-8">
        <UnifiedTripSearchV2 
          viopOnly={true}
          {...extraProps}
        />
      </div>
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      <div className="bg-gradient-to-r from-blue-600 to-sky-600 text-white py-8 md:py-12 shadow-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            <div className="relative p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
              <Bus className="w-10 h-10 md:w-12 md:h-12 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white">
                Carregando...
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principal com Suspense
export default function BuscarTestePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BuscarTesteContent />
    </Suspense>
  );
}