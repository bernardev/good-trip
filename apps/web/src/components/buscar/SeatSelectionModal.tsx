// apps/web/src/components/buscar/SeatSelectionModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import { SeatGrid } from './SeatGrid';

type Poltrona = {
  numero: string;
  livre: boolean;
  classe?: string;
};

type TrechoData = {
  servico: string;
  origem: string;
  destino: string;
  origemNome: string;
  destinoNome: string;
  data: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  trechos: TrechoData[];
  onComplete: (assentos: string[]) => void;
};

type TrechoComAssentos = {
  poltronas: Poltrona[];
  assentoSelecionado: string | null;
  loading: boolean;
  erro: string | null;
};

function seatIsFree(p: {
  livre?: boolean | number | string;
  disponivel?: boolean | number | string;
  status?: string;
}): boolean {
  const raw = p.livre ?? p.disponivel ?? p.status;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw === 1;
  if (raw == null) return false;
  const v = String(raw).trim().toUpperCase();
  return ['LIVRE', 'DISPONIVEL', 'AVAILABLE', 'FREE', 'TRUE', 'SIM', '1'].includes(v);
}

export function SeatSelectionModal({ isOpen, onClose, trechos, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [trechosComAssentos, setTrechosComAssentos] = useState<TrechoComAssentos[]>([]);

  // Inicializar ao abrir modal
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setTrechosComAssentos(
        trechos.map(() => ({
          poltronas: [],
          assentoSelecionado: null,
          loading: true,
          erro: null,
        }))
      );
      
      // Buscar assentos do primeiro trecho
      void buscarAssentos(0);
    }
  }, [isOpen]);

  const buscarAssentos = async (index: number): Promise<void> => {
    const trecho = trechos[index];
    if (!trecho) return;

    try {
      const endpoint = trechos.length > 1 ? '/api/viop/onibus-trecho' : '/api/viop/onibus';
      const url = `${endpoint}?servico=${trecho.servico}&origemId=${trecho.origem}&destinoId=${trecho.destino}&data=${trecho.data}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }

      const json: {
        ok: boolean;
        seats?: {
          mapaPoltrona?: Array<{
            numero?: string | number;
            livre?: boolean | number | string;
            disponivel?: boolean | number | string;
            status?: string;
            classe?: string;
          }>;
        };
      } = await response.json();

      if (!json.ok || !json.seats?.mapaPoltrona) {
        throw new Error('Dados inválidos');
      }

      const poltronas: Poltrona[] = json.seats.mapaPoltrona
        .map((p) => ({
          numero: String(p.numero ?? ''),
          livre: seatIsFree(p),
          classe: p.classe,
        }))
        .filter((p: Poltrona) => {
          if (!p.numero || p.numero === '') return false;
          if (p.numero.toUpperCase() === 'WC') return false;
          return /^\d+$/.test(p.numero);
        });

      setTrechosComAssentos(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          poltronas,
          loading: false,
          erro: null,
        };
        return updated;
      });
    } catch (error) {
      setTrechosComAssentos(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          loading: false,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        };
        return updated;
      });
    }
  };

  const selecionarAssento = (numeroAssento: string): void => {
    setTrechosComAssentos(prev => {
      const updated = [...prev];
      const atual = updated[currentStep];
      
      if (atual.assentoSelecionado === numeroAssento) {
        updated[currentStep] = { ...atual, assentoSelecionado: null };
      } else {
        updated[currentStep] = { ...atual, assentoSelecionado: numeroAssento };
      }
      
      return updated;
    });
  };

  const handleContinuar = (): void => {
    const assentoAtual = trechosComAssentos[currentStep]?.assentoSelecionado;
    
    if (!assentoAtual) {
      alert('Selecione um assento');
      return;
    }

    // Se é o último trecho, finalizar
    if (currentStep === trechos.length - 1) {
      const assentosSelecionados = trechosComAssentos.map(t => t.assentoSelecionado).filter(Boolean) as string[];
      onComplete(assentosSelecionados);
      return;
    }

    // Ir para próximo trecho
    const proximoStep = currentStep + 1;
    setCurrentStep(proximoStep);
    
    // Buscar assentos do próximo trecho se ainda não buscou
    if (trechosComAssentos[proximoStep].poltronas.length === 0) {
      void buscarAssentos(proximoStep);
    }
  };

  const trechoAtual = trechos[currentStep];
  const dadosAtual = trechosComAssentos[currentStep];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center md:justify-center">
      <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">Escolha seu assento</h2>
            {trechos.length > 1 && (
              <div className="flex items-center gap-2 mt-1">
                {trechos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center ${idx > 0 ? 'ml-1' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        idx === currentStep
                          ? 'bg-blue-600 text-white'
                          : idx < currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    {idx < trechos.length - 1 && (
                      <div className={`w-8 h-0.5 ${idx < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {trechoAtual && (
            <>
              {/* Info do trecho */}
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-xs text-blue-600 font-bold mb-1">
                  {trechos.length > 1 ? `TRECHO ${currentStep + 1}` : 'TRECHO ÚNICO'}
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {trechoAtual.origemNome} → {trechoAtual.destinoNome}
                </div>
              </div>

              {/* Loading */}
              {dadosAtual?.loading && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-600 font-medium">Carregando sua passagem...</p>
                </div>
              )}

              {/* Erro */}
              {dadosAtual?.erro && (
                <div className="text-center py-12">
                  <p className="text-sm text-red-600">{dadosAtual.erro}</p>
                </div>
              )}

              {/* Grid de assentos */}
              {!dadosAtual?.loading && !dadosAtual?.erro && dadosAtual?.poltronas.length > 0 && (
                <>
                  {/* Legenda */}
                  <div className="flex items-center justify-center gap-4 mb-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg border-2 border-blue-500 bg-white" />
                      <span>Livre</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">✓</div>
                      <span>Selecionado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-300 text-slate-500 flex items-center justify-center font-bold text-[10px]">X</div>
                      <span>Ocupado</span>
                    </div>
                  </div>

                  {/* Mapa de assentos */}
                  <SeatGrid
                    poltronas={dadosAtual.poltronas}
                    assentoSelecionado={dadosAtual.assentoSelecionado}
                    onSelecionarAssento={selecionarAssento}
                  />
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
          {dadosAtual?.assentoSelecionado && (
            <div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold text-blue-900">
                  Assento {dadosAtual.assentoSelecionado} selecionado
                </span>
              </div>
              <span className="text-lg font-black text-blue-600">R$ 170,00</span>
            </div>
          )}
          
          <button
            onClick={handleContinuar}
            disabled={!dadosAtual?.assentoSelecionado}
            className={`
              w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2
              ${dadosAtual?.assentoSelecionado
                ? 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700'
                : 'bg-gray-300 cursor-not-allowed'
              }
            `}
          >
            {currentStep === trechos.length - 1 ? 'Continuar reserva' : 'Próximo trecho'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}