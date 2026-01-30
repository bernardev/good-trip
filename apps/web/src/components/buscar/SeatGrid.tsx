// apps/web/src/components/buscar/SeatGrid.tsx
'use client';

import { useState, useEffect } from 'react';

type Poltrona = {
  numero: string;
  livre: boolean;
  classe?: string;
};

type SeatGridProps = {
  poltronas: Poltrona[];
  assentoSelecionado: string | null;
  onSelecionarAssento: (numero: string) => void;
};

export function SeatGrid({ poltronas, assentoSelecionado, onSelecionarAssento }: SeatGridProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const renderAssento = (poltrona: Poltrona | null) => {
    if (!poltrona) {
      return <div className="w-12 h-12 md:w-12 md:h-12" />;
    }

    const selecionado = assentoSelecionado === poltrona.numero;
    const disponivel = poltrona.livre;

    return (
      <button
        key={poltrona.numero}
        onClick={() => {
          if (disponivel) {
            onSelecionarAssento(poltrona.numero);
          }
        }}
        disabled={!disponivel}
        className={`
          w-12 h-12 md:w-12 md:h-12 rounded-lg font-bold text-sm transition-all
          ${selecionado
            ? 'bg-blue-600 text-white shadow-lg scale-110 border-2 border-blue-700'
            : disponivel
            ? 'bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:scale-105'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }
        `}
      >
        {disponivel || selecionado ? poltrona.numero : 'X'}
      </button>
    );
  };

  // 🔥 MOBILE: Layout vertical (retrato)
  if (isMobile) {
    // Organizar em 4 colunas: 2 esquerda + corredor + 2 direita
    const coluna1: Poltrona[] = [];
    const coluna2: Poltrona[] = [];
    const coluna3: Poltrona[] = [];
    const coluna4: Poltrona[] = [];
    
    poltronas.forEach((poltrona, index) => {
      const col = index % 4;
      if (col === 0) coluna1.push(poltrona);
      else if (col === 1) coluna2.push(poltrona);
      else if (col === 2) coluna3.push(poltrona);
      else if (col === 3) coluna4.push(poltrona);
    });

    return (
      <div className="w-full flex justify-center">
        <div className="inline-flex flex-col bg-slate-100 rounded-3xl p-4 border-2 border-slate-300">
          
          {/* Volante no topo (esquerda) */}
          <div className="flex justify-start mb-4 pl-2">
            <div className="flex items-center justify-center bg-slate-700 rounded-full w-16 h-16">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="10" cy="10" r="2.5" fill="currentColor"/>
              </svg>
            </div>
          </div>

          {/* Grid de assentos - 4 colunas */}
          <div className="flex gap-2">
            {/* Coluna 1 (esquerda) */}
            <div className="flex flex-col gap-2">
              {coluna1.map((poltrona, idx) => (
                <div key={idx}>{renderAssento(poltrona)}</div>
              ))}
            </div>

            {/* Coluna 2 (esquerda) */}
            <div className="flex flex-col gap-2">
              {coluna2.map((poltrona, idx) => (
                <div key={idx}>{renderAssento(poltrona)}</div>
              ))}
            </div>

            {/* Corredor vertical */}
            <div className="w-4 border-l-2 border-r-2 border-dashed border-slate-400" />

            {/* Coluna 3 (direita) */}
            <div className="flex flex-col gap-2">
              {coluna3.map((poltrona, idx) => (
                <div key={idx}>{renderAssento(poltrona)}</div>
              ))}
            </div>

            {/* Coluna 4 (direita) */}
            <div className="flex flex-col gap-2">
              {coluna4.map((poltrona, idx) => (
                <div key={idx}>{renderAssento(poltrona)}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🔥 DESKTOP: Layout horizontal (paisagem) - ORIGINAL
  const fileira1: (Poltrona | null)[] = [];
  const fileira2: (Poltrona | null)[] = [];
  const fileira3: (Poltrona | null)[] = [];
  const fileira4: (Poltrona | null)[] = [];
  
  poltronas.forEach((poltrona, index) => {
    const col = Math.floor(index / 4);
    const row = index % 4;
    
    if (row === 0) fileira1[col] = poltrona;
    else if (row === 1) fileira2[col] = poltrona;
    else if (row === 2) fileira3[col] = poltrona;
    else if (row === 3) fileira4[col] = poltrona;
  });

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="inline-flex min-w-max mx-auto bg-slate-100 rounded-3xl p-6 border-2 border-slate-300">
        
        {/* Coluna 1: VOLANTE (só na última linha) */}
        <div className="flex flex-col gap-2 mr-2">
          <div className="w-12 h-12" />
          <div className="w-12 h-12" />
          <div className="w-12 h-4" />
          <div className="w-12 h-12" />
          <div className="flex items-center justify-center bg-slate-700 rounded-xl w-12 h-12">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="10" cy="10" r="2.5" fill="currentColor"/>
            </svg>
          </div>
        </div>

        {/* Coluna 2: ESPAÇO VAZIO */}
        <div className="flex flex-col gap-2 mr-2">
          <div className="w-16 h-12" />
          <div className="w-16 h-12" />
          <div className="w-16 h-4" />
          <div className="w-16 h-12" />
          <div className="w-16 h-12" />
        </div>

        {/* Coluna 3: ASSENTOS */}
        <div className="flex flex-col gap-2">
          {/* Fileira 1 */}
          <div className="flex gap-2">
            {fileira1.map((poltrona, idx) => (
              <div key={idx}>{renderAssento(poltrona)}</div>
            ))}
          </div>

          {/* Fileira 2 */}
          <div className="flex gap-2">
            {fileira2.map((poltrona, idx) => (
              <div key={idx}>{renderAssento(poltrona)}</div>
            ))}
          </div>

          {/* Corredor */}
          <div className="h-4 border-t-2 border-b-2 border-dashed border-slate-400" />

          {/* Fileira 3 */}
          <div className="flex gap-2">
            {fileira3.map((poltrona, idx) => (
              <div key={idx}>{renderAssento(poltrona)}</div>
            ))}
          </div>

          {/* Fileira 4 */}
          <div className="flex gap-2">
            {fileira4.map((poltrona, idx) => (
              <div key={idx}>{renderAssento(poltrona)}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}