'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Armchair, Users, DollarSign, CheckCircle2, XCircle, Bus, Navigation, Move } from 'lucide-react';

type Poltrona = {
  numero: string;
  livre: boolean;
  classe?: string;
};

type Meta = {
  poltronasTotal?: number;
  poltronasLivres?: number;
  preco?: number;
  empresa?: string;
  classe?: string;
};

type Query = {
  servico: string;
  origem: string;
  destino: string;
  data: string;
};

type Props = {
  poltronas: Poltrona[];
  meta: Meta;
  query: Query;
  maxSelect?: number;
};

export default function AssentosClient({ poltronas, meta, query, maxSelect = 5 }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  // Organizar poltronas em layout de ônibus (2 colunas + corredor + 2 colunas)
  const layoutPoltronas = useMemo(() => {
    const rows: Array<{
      left: Poltrona[];
      right: Poltrona[];
    }> = [];

    // Agrupar de 4 em 4 (2 esquerda, 2 direita)
    for (let i = 0; i < poltronas.length; i += 4) {
      const chunk = poltronas.slice(i, i + 4);
      rows.push({
        left: chunk.slice(0, 2),
        right: chunk.slice(2, 4)
      });
    }

    return rows;
  }, [poltronas]);

  // Identificar se assento é janela ou corredor
  const getTipoPosicao = (index: number, lado: 'left' | 'right') => {
    if (lado === 'left') {
      return index === 0 ? 'janela' : 'corredor';
    } else {
      return index === 1 ? 'janela' : 'corredor';
    }
  };

  const toggleSeat = (numero: string, livre: boolean) => {
    if (!livre) return;

    setSelected(prev => {
      if (prev.includes(numero)) {
        return prev.filter(n => n !== numero);
      } else {
        if (prev.length >= maxSelect) {
          return prev;
        }
        return [...prev, numero];
      }
    });
  };

  const getSeatClass = (numero: string, livre: boolean, tipo: 'janela' | 'corredor') => {
    const baseClass = 'w-16 h-16 rounded-xl border-2 font-bold text-sm transition-all duration-300 flex items-center justify-center relative';
    
    if (!livre) {
      return `${baseClass} bg-slate-300 text-slate-500 cursor-not-allowed border-slate-400`;
    }
    if (selected.includes(numero)) {
      return `${baseClass} bg-blue-600 text-white border-blue-700 shadow-lg scale-105 hover:bg-blue-700`;
    }
    
    // Diferenciação visual janela vs corredor
    if (tipo === 'janela') {
      return `${baseClass} bg-gradient-to-br from-sky-50 to-blue-50 text-slate-800 border-blue-300 hover:border-blue-500 hover:bg-blue-100 hover:scale-105 cursor-pointer`;
    } else {
      return `${baseClass} bg-white text-slate-800 border-slate-300 hover:border-blue-500 hover:bg-blue-50 hover:scale-105 cursor-pointer`;
    }
  };

  const totalPrice = useMemo(() => {
    return (meta.preco ?? 0) * selected.length;
  }, [selected.length, meta.preco]);

  const handleContinue = () => {
    if (selected.length === 0) return;

    const params = new URLSearchParams({
      ...query,
      assentos: selected.join(',')
    });

    router.push(`/buscar-viop/pre-compra?${params.toString()}`);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/buscar-viop');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-6">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6 flex justify-start">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:bg-slate-50 hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Selecione seus Assentos</h1>
          <p className="text-slate-600">Escolha até {maxSelect} poltronas para sua viagem</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          {/* MAPA DO ÔNIBUS */}
          <div className="rounded-2xl bg-white p-8 shadow-xl border border-slate-200">
            
            {/* FRENTE DO ÔNIBUS */}
            <div className="mb-6 relative">
              <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-4 px-6 shadow-lg">
                <Navigation className="w-6 h-6" />
                <span className="font-bold text-lg">FRENTE DO ÔNIBUS</span>
                <Navigation className="w-6 h-6" />
              </div>
              {/* Indicador visual do motorista */}
              <div className="absolute -bottom-4 left-8 bg-slate-700 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Bus className="w-3 h-3" />
                Motorista
              </div>
            </div>

            {/* Layout Desktop (Horizontal) */}
            <div className="hidden md:block mt-8">
              <div className="space-y-3">
                {layoutPoltronas.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center justify-center gap-4">
                    
                    {/* Coluna Esquerda (2 assentos) */}
                    <div className="flex gap-2">
                      {row.left.map((poltrona, idx) => {
                        const tipo = getTipoPosicao(idx, 'left');
                        return (
                          <div key={poltrona.numero} className="relative">
                            <button
                              onClick={() => toggleSeat(poltrona.numero, poltrona.livre)}
                              disabled={!poltrona.livre}
                              className={getSeatClass(poltrona.numero, poltrona.livre, tipo)}
                            >
                              {poltrona.numero}
                            </button>
                            {/* Badge indicando posição */}
                            {poltrona.livre && (
                              <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                tipo === 'janela' 
                                  ? 'bg-sky-500 text-white' 
                                  : 'bg-slate-400 text-white'
                              }`}>
                                {tipo === 'janela' ? '🪟' : '🚶'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* CORREDOR */}
                    <div className="w-16 flex flex-col items-center justify-center">
                      <div className="h-12 w-px bg-gradient-to-b from-slate-200 via-slate-400 to-slate-200" />
                      <Move className="w-4 h-4 text-slate-400 my-1" />
                      <div className="h-12 w-px bg-gradient-to-b from-slate-200 via-slate-400 to-slate-200" />
                    </div>

                    {/* Coluna Direita (2 assentos) */}
                    <div className="flex gap-2">
                      {row.right.map((poltrona, idx) => {
                        const tipo = getTipoPosicao(idx, 'right');
                        return (
                          <div key={poltrona.numero} className="relative">
                            <button
                              onClick={() => toggleSeat(poltrona.numero, poltrona.livre)}
                              disabled={!poltrona.livre}
                              className={getSeatClass(poltrona.numero, poltrona.livre, tipo)}
                            >
                              {poltrona.numero}
                            </button>
                            {/* Badge indicando posição */}
                            {poltrona.livre && (
                              <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                tipo === 'janela' 
                                  ? 'bg-sky-500 text-white' 
                                  : 'bg-slate-400 text-white'
                              }`}>
                                {tipo === 'janela' ? '🪟' : '🚶'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* BANHEIRO NO FUNDO */}
              <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-300">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-6 text-center border-2 border-slate-300">
                  <div className="text-4xl mb-2">🚽</div>
                  <p className="font-bold text-slate-700">BANHEIRO (WC)</p>
                  <p className="text-xs text-slate-500 mt-1">Localizado no fundo do ônibus</p>
                </div>
              </div>
            </div>

            {/* Layout Mobile (Grid com Corredor Visível) */}
            <div className="block md:hidden">
              <div className="space-y-2">
                {layoutPoltronas.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center justify-center gap-2">
                    {/* Lado Esquerdo */}
                    <div className="flex gap-1">
                      {row.left.map((poltrona, idx) => {
                        const tipo = getTipoPosicao(idx, 'left');
                        return (
                          <div key={poltrona.numero} className="relative">
                            <button
                              onClick={() => toggleSeat(poltrona.numero, poltrona.livre)}
                              disabled={!poltrona.livre}
                              className={`
                                w-12 h-12 rounded-lg border-2 font-bold text-xs
                                transition-all duration-300 flex items-center justify-center
                                ${getSeatClass(poltrona.numero, poltrona.livre, tipo)}
                              `}
                            >
                              {poltrona.numero}
                            </button>
                            {poltrona.livre && (
                              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
                                tipo === 'janela' ? 'bg-sky-500' : 'bg-slate-400'
                              }`}>
                                {tipo === 'janela' ? '🪟' : '🚶'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* CORREDOR MOBILE */}
                    <div className="flex flex-col items-center px-2">
                      <div className="h-4 w-px bg-slate-300" />
                      <div className="bg-slate-200 rounded px-1.5 py-0.5">
                        <Move className="w-3 h-3 text-slate-500" />
                      </div>
                      <div className="h-4 w-px bg-slate-300" />
                    </div>

                    {/* Lado Direito */}
                    <div className="flex gap-1">
                      {row.right.map((poltrona, idx) => {
                        const tipo = getTipoPosicao(idx, 'right');
                        return (
                          <div key={poltrona.numero} className="relative">
                            <button
                              onClick={() => toggleSeat(poltrona.numero, poltrona.livre)}
                              disabled={!poltrona.livre}
                              className={`
                                w-12 h-12 rounded-lg border-2 font-bold text-xs
                                transition-all duration-300 flex items-center justify-center
                                ${getSeatClass(poltrona.numero, poltrona.livre, tipo)}
                              `}
                            >
                              {poltrona.numero}
                            </button>
                            {poltrona.livre && (
                              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
                                tipo === 'janela' ? 'bg-sky-500' : 'bg-slate-400'
                              }`}>
                                {tipo === 'janela' ? '🪟' : '🚶'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* WC Mobile */}
              <div className="mt-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-4 text-center border-2 border-slate-300">
                <span className="text-3xl">🚽</span>
                <p className="text-xs font-bold text-slate-700 mt-1">BANHEIRO (WC)</p>
              </div>
            </div>

            {/* Legenda ATUALIZADA */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="font-semibold text-slate-700 mb-4">Legenda:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-blue-300 flex items-center justify-center">
                    <span className="text-lg">🪟</span>
                  </div>
                  <span className="text-sm text-slate-700 font-semibold">Janela (Disponível)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border-2 border-slate-300 flex items-center justify-center">
                    <span className="text-lg">🚶</span>
                  </div>
                  <span className="text-sm text-slate-700 font-semibold">Corredor (Disponível)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 border-2 border-blue-700 flex items-center justify-center">
                    <Armchair className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-slate-700 font-semibold">Selecionado</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-300 border-2 border-slate-400 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-slate-500" />
                  </div>
                  <span className="text-sm text-slate-700 font-semibold">Ocupado</span>
                </div>
              </div>
            </div>
          </div>

          {/* RESUMO LATERAL (mantido igual) */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200 sticky top-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-blue-600 p-2">
                  <Bus className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-lg">Resumo da Viagem</h3>
              </div>

              {meta.empresa && (
                <div className="mb-4 p-3 rounded-lg bg-slate-50">
                  <p className="text-sm text-slate-600">Empresa</p>
                  <p className="font-semibold text-slate-900">{meta.empresa}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Armchair className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-blue-700">Disponíveis</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {meta.poltronasLivres ?? 0}
                  </p>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="text-xs text-slate-600">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-700">
                    {meta.poltronasTotal ?? 0}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-slate-700 mb-3">Assentos Selecionados</h4>
                {selected.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Armchair className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum assento selecionado</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selected.map(num => (
                      <div
                        key={num}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm shadow-md"
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600">Preço unitário</span>
                  <span className="font-medium">R$ {(meta.preco ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600">Quantidade</span>
                  <span className="font-medium">{selected.length}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <span className="text-lg font-bold">Total</span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      R$ {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleContinue}
                disabled={selected.length === 0}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {selected.length === 0 ? (
                  'Selecione pelo menos 1 assento'
                ) : (
                  <>
                    Continuar com {selected.length} {selected.length === 1 ? 'assento' : 'assentos'}
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>

              {selected.length > 0 && selected.length < maxSelect && (
                <p className="text-xs text-center text-slate-500 mt-3">
                  Você pode selecionar até {maxSelect - selected.length} assento(s) adicional(is)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}