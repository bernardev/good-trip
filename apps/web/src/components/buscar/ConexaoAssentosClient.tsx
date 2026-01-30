// apps/web/src/components/buscar/ConexaoAssentosClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { Bus, ArrowRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Poltrona = {
  numero: string;
  livre: boolean;
  classe?: string;
};

type TrechoAssentos = {
  trechoId: number;
  servico: string;
  origem: string;
  destino: string;
  origemNome: string;
  destinoNome: string;
  data: string;
  poltronas: Poltrona[];
  assentoSelecionado: string | null;
  loading: boolean;
  erro: string | null;
};

type ConexaoAssentosClientProps = {
  trecho1: {
    servico: string;
    origem: string;
    destino: string;
    origemNome: string;
    destinoNome: string;
    data: string;
  };
  trecho2: {
    servico: string;
    origem: string;
    destino: string;
    origemNome: string;
    destinoNome: string;
    data: string;
  };
  maxPassageiros?: number;
};

export default function ConexaoAssentosClient({
  trecho1,
  trecho2,
  maxPassageiros = 1,
}: ConexaoAssentosClientProps) {
  const router = useRouter();
  
  const [trechos, setTrechos] = useState<TrechoAssentos[]>([
    {
      trechoId: 1,
      ...trecho1,
      poltronas: [],
      assentoSelecionado: null,
      loading: true,
      erro: null,
    },
    {
      trechoId: 2,
      ...trecho2,
      poltronas: [],
      assentoSelecionado: null,
      loading: true,
      erro: null,
    },
  ]);

  // Buscar assentos de ambos os trechos
  useEffect(() => {
    buscarAssentosTrecho(0, trecho1);
    buscarAssentosTrecho(1, trecho2);
  }, []);

  const buscarAssentosTrecho = async (
    index: number,
    dados: {
      servico: string;
      origem: string;
      destino: string;
      data: string;
    }
  ) => {
    try {
      const url = `/api/viop/onibus?servico=${dados.servico}&origemId=${dados.origem}&destinoId=${dados.destino}&data=${dados.data}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar assentos: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.ok || !data.seats?.mapaPoltrona) {
        throw new Error('Dados de assentos inválidos');
      }

      const poltronas: Poltrona[] = data.seats.mapaPoltrona
        .map((p: { numero: string | number; livre?: boolean | number | string; disponivel?: boolean | number | string; status?: string; classe?: string }) => ({
          numero: String(p.numero ?? ''),
          livre: seatIsFree(p),
          classe: p.classe,
        }))
        .filter((p: Poltrona) => {
          if (!p.numero || p.numero === '') return false;
          if (p.numero.toUpperCase() === 'WC') return false;
          return /^\d+$/.test(p.numero);
        });

      setTrechos((prev) => {
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
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setTrechos((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          loading: false,
          erro: mensagem,
        };
        return updated;
      });
    }
  };

  const seatIsFree = (p: {
    livre?: boolean | number | string;
    disponivel?: boolean | number | string;
    status?: string;
  }): boolean => {
    const raw = p.livre ?? p.disponivel ?? p.status;
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'number') return raw === 1;
    if (raw == null) return false;
    const v = String(raw).trim().toUpperCase();
    return ['LIVRE', 'DISPONIVEL', 'AVAILABLE', 'FREE', 'TRUE', 'SIM', '1'].includes(v);
  };

  const handleSelecionarAssento = (trechoIndex: number, numeroAssento: string) => {
    setTrechos((prev) => {
      const updated = [...prev];
      const trecho = updated[trechoIndex];
      
      // Toggle: se clicar no mesmo, desmarca
      if (trecho.assentoSelecionado === numeroAssento) {
        updated[trechoIndex] = {
          ...trecho,
          assentoSelecionado: null,
        };
      } else {
        // Seleciona novo assento
        updated[trechoIndex] = {
          ...trecho,
          assentoSelecionado: numeroAssento,
        };
      }
      
      return updated;
    });
  };

  const handleContinuar = () => {
    // Validar que ambos os trechos têm assento selecionado
    const assento1 = trechos[0].assentoSelecionado;
    const assento2 = trechos[1].assentoSelecionado;

    if (!assento1 || !assento2) {
      alert('Por favor, selecione um assento em cada trecho antes de continuar.');
      return;
    }

    // TODO: Navegar para página de dados dos passageiros
    console.log('Assentos selecionados:', { assento1, assento2 });
    alert(`Assentos selecionados!\nTrecho 1: ${assento1}\nTrecho 2: ${assento2}\n\n(Próximo passo: dados dos passageiros)`);
  };

  const todosSelecionados = trechos.every((t) => t.assentoSelecionado !== null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
            Selecione seus Assentos
          </h1>
          <p className="text-slate-600">
            Você precisa selecionar <strong>1 assento em cada trecho</strong> da sua viagem com conexão.
          </p>
        </div>

        {/* Trechos */}
        <div className="space-y-6">
          {trechos.map((trecho, index) => (
            <div key={trecho.trechoId} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              
              {/* Header do Trecho */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="rounded-full bg-blue-100 px-4 py-2">
                  <span className="font-black text-blue-600">Trecho {trecho.trechoId}</span>
                </div>
                <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <span>{trecho.origemNome}</span>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                  <span>{trecho.destinoNome}</span>
                </div>
                {trecho.assentoSelecionado && (
                  <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-900">Assento {trecho.assentoSelecionado}</span>
                  </div>
                )}
              </div>

              {/* Loading */}
              {trecho.loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-slate-600">Carregando assentos...</p>
                </div>
              )}

              {/* Erro */}
              {trecho.erro && (
                <div className="flex flex-col items-center justify-center py-12">
                  <XCircle className="w-12 h-12 text-red-600 mb-4" />
                  <p className="text-red-600 font-semibold mb-2">Erro ao carregar assentos</p>
                  <p className="text-slate-600 text-sm">{trecho.erro}</p>
                </div>
              )}

              {/* Mapa de Assentos */}
              {!trecho.loading && !trecho.erro && trecho.poltronas.length > 0 && (
                <div>
                  {/* Legenda */}
                  <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg border-2 border-blue-500 bg-white" />
                      <span className="text-slate-700">Livre</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <span className="text-slate-700">Selecionado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-300" />
                      <span className="text-slate-700">Ocupado</span>
                    </div>
                  </div>

                  {/* Grid de Assentos */}
                  <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                    {trecho.poltronas.map((poltrona) => {
                      const selecionado = trecho.assentoSelecionado === poltrona.numero;
                      const disponivel = poltrona.livre;

                      return (
                        <button
                          key={poltrona.numero}
                          onClick={() => {
                            if (disponivel) {
                              handleSelecionarAssento(index, poltrona.numero);
                            }
                          }}
                          disabled={!disponivel}
                          className={`
                            aspect-square rounded-lg font-bold text-sm transition-all
                            ${selecionado
                              ? 'bg-blue-600 text-white shadow-lg scale-110 border-2 border-blue-700'
                              : disponivel
                              ? 'bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:scale-105'
                              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            }
                          `}
                        >
                          {poltrona.numero}
                        </button>
                      );
                    })}
                  </div>

                  {/* Contador */}
                  <div className="mt-6 text-center text-sm text-slate-600">
                    {trecho.poltronas.filter((p) => p.livre).length} assentos disponíveis
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botão Continuar */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
          >
            ← Voltar
          </button>

          <button
            onClick={handleContinuar}
            disabled={!todosSelecionados}
            className={`
              px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2
              ${todosSelecionados
                ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white hover:from-blue-700 hover:to-sky-700 shadow-lg hover:shadow-xl'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {todosSelecionados ? (
              <>
                <CheckCircle2 className="w-6 h-6" />
                Continuar
              </>
            ) : (
              <>
                <Bus className="w-6 h-6" />
                Selecione os assentos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}