// apps/web/src/app/buscar-viop/conexao/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { Bus, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { SeatGrid } from '@/components/buscar/SeatGrid';

type Poltrona = {
  numero: string;
  livre: boolean;
  classe?: string;
};

type ConexaoTrecho = {
  servico: string;
  origem: string;
  destino: string;
  origemDescricao: string;
  destinoDescricao: string;
  horaSaida: string;
  horaChegada: string;
  dataSaida: string;
  dataChegada: string;
  preco: number;
  precoOriginal: number;
  classe: string;
  empresa: string;
  empresaId: number;
  poltronasLivres: number;
  poltronasTotal: number;
  sequencia: number;
};

type ConexaoData = {
  temConexao: boolean;
  localidadeConexao: string;
  localidadeConexaoId: number;
  tempoEspera: number;
  trechos: ConexaoTrecho[];
  numeroTrechos: number;
  precoTotal: number;
  duracaoTotal: number;
};

type TrechoComAssentos = ConexaoTrecho & {
  expandido: boolean;
  poltronas: Poltrona[];
  assentoSelecionado: string | null;
  loading: boolean;
  erro: string | null;
};

function formatarTempo(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  if (horas === 0) return `${mins}min`;
  if (mins === 0) return `${horas}h`;
  return `${horas}h ${mins}min`;
}

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

function ConexaoPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const servico = searchParams.get('servico') ?? '';
  const origem = searchParams.get('origem') ?? '';
  const destino = searchParams.get('destino') ?? '';
  const data = searchParams.get('data') ?? '';

  const [conexao, setConexao] = useState<ConexaoData | null>(null);
  const [trechos, setTrechos] = useState<TrechoComAssentos[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!servico || !origem || !destino || !data) {
      setErro('Parâmetros incompletos');
      setLoading(false);
      return;
    }

    buscarConexao();
  }, [servico, origem, destino, data]);

  const buscarConexao = async () => {
    try {
      const url = `/api/viop/conexao?servico=${servico}&origemId=${origem}&destinoId=${destino}&data=${data}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }

      const json = await response.json();
      
      if (!json.ok || !json.conexao) {
        throw new Error('Dados inválidos');
      }

      setConexao(json.conexao);
      
      setTrechos(json.conexao.trechos.map((t: ConexaoTrecho) => ({
        ...t,
        expandido: false,
        poltronas: [],
        assentoSelecionado: null,
        loading: false,
        erro: null,
      })));
      
      setLoading(false);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar');
      setLoading(false);
    }
  };

  const toggleTrecho = async (index: number) => {
    const trecho = trechos[index];
    
    if (trecho.expandido) {
      setTrechos(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], expandido: false };
        return updated;
      });
      return;
    }

    if (trecho.poltronas.length === 0) {
      setTrechos(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], loading: true, expandido: true };
        return updated;
      });

      try {
        const url = `/api/viop/onibus?servico=${trecho.servico}&origemId=${trecho.origem}&destinoId=${trecho.destino}&data=${data}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}`);
        }

        const json = await response.json();
        
        if (!json.ok || !json.seats?.mapaPoltrona) {
          throw new Error('Dados de assentos inválidos');
        }

        const poltronas: Poltrona[] = json.seats.mapaPoltrona
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

        setTrechos(prev => {
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
        setTrechos(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            loading: false,
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
          };
          return updated;
        });
      }
    } else {
      setTrechos(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], expandido: true };
        return updated;
      });
    }
  };

  const selecionarAssento = (trechoIndex: number, numeroAssento: string) => {
    setTrechos(prev => {
      const updated = [...prev];
      const trecho = updated[trechoIndex];
      
      if (trecho.assentoSelecionado === numeroAssento) {
        updated[trechoIndex] = { ...trecho, assentoSelecionado: null };
      } else {
        updated[trechoIndex] = { ...trecho, assentoSelecionado: numeroAssento };
      }
      
      return updated;
    });
  };

  const handleContinuar = () => {
    const assento1 = trechos[0]?.assentoSelecionado;
    const assento2 = trechos[1]?.assentoSelecionado;

    if (!assento1 || !assento2) {
      alert('Selecione um assento em cada trecho');
      return;
    }

    console.log('Assentos:', { assento1, assento2 });
    alert(`Assentos selecionados!\nTrecho 1: ${assento1}\nTrecho 2: ${assento2}`);
  };

  const todosSelecionados = trechos.length === 2 && 
                            trechos[0].assentoSelecionado !== null && 
                            trechos[1].assentoSelecionado !== null;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando conexão...</p>
        </div>
      </main>
    );
  }

  if (erro || !conexao) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-xl border border-slate-200 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Erro</h1>
          <p className="text-slate-600 mb-6">{erro}</p>
          <Link href="/buscar-viop" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
            <Bus className="w-5 h-5" />
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-orange-100 p-3">
              <RefreshCw className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                Viagem com Conexão
              </h1>
              <p className="text-slate-600 mb-4">
                Esta viagem possui <strong>1 parada</strong> em{' '}
                <strong className="text-orange-600">{conexao.localidadeConexao}</strong>
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Tempo total:</span>
                  <span className="text-slate-900 font-bold">{formatarTempo(conexao.duracaoTotal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Tempo de espera:</span>
                  <span className="text-orange-600 font-bold">{formatarTempo(conexao.tempoEspera)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Valor total:</span>
                  <span className="text-blue-600 font-bold text-lg">
                    R$ {conexao.precoTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trechos */}
        <div className="space-y-6">
          {trechos.map((trecho, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-6">
                {/* Header do Trecho */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                  <div className="rounded-full bg-blue-100 px-4 py-2">
                    <span className="font-black text-blue-600">Trecho {index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      <span>{trecho.origemDescricao}</span>
                      <span className="text-slate-400">→</span>
                      <span>{trecho.destinoDescricao}</span>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {trecho.empresa} • {trecho.classe}
                    </div>
                  </div>
                  {trecho.assentoSelecionado && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-bold text-green-900">Assento {trecho.assentoSelecionado}</span>
                    </div>
                  )}
                </div>

                {/* Info do Trecho */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Partida</div>
                    <div className="text-2xl font-black text-slate-900">{trecho.horaSaida}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Chegada</div>
                    <div className="text-2xl font-black text-slate-900">{trecho.horaChegada}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Assentos</div>
                    <div className="text-2xl font-black text-green-600">
                      {trecho.poltronasLivres}/{trecho.poltronasTotal}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Valor</div>
                    <div className="text-2xl font-black text-blue-600">
                      R$ {trecho.preco.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Botão Selecionar */}
                <button
                  onClick={() => toggleTrecho(index)}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {trecho.expandido ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Ocultar Assentos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      Selecionar Assentos
                    </>
                  )}
                </button>
              </div>

              {/* Assentos Expandidos */}
              {trecho.expandido && (
                <div className="border-t border-slate-200 bg-slate-50 p-6">
                  {trecho.loading && (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-slate-600 text-sm">Carregando assentos...</p>
                    </div>
                  )}

                  {trecho.erro && (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <p className="text-red-600 text-sm">{trecho.erro}</p>
                    </div>
                  )}

                  {!trecho.loading && !trecho.erro && trecho.poltronas.length > 0 && (
                    <>
                      {/* Legenda */}
                      <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg border-2 border-blue-500 bg-white" />
                          <span>Livre</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">✓</div>
                          <span>Selecionado</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-300 text-slate-500 flex items-center justify-center font-bold text-xs">X</div>
                          <span>Ocupado</span>
                        </div>
                      </div>

                      {/* Grid de Assentos */}
                      <SeatGrid
                        poltronas={trecho.poltronas}
                        assentoSelecionado={trecho.assentoSelecionado}
                        onSelecionarAssento={(numero) => selecionarAssento(index, numero)}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botão Continuar */}
        <div className="mt-8 flex justify-between items-center">
          <Link href="/buscar-viop" className="text-slate-600 hover:text-slate-900 font-semibold">
            ← Voltar
          </Link>

          <button
            onClick={handleContinuar}
            disabled={!todosSelecionados}
            className={`
              px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2
              ${todosSelecionados
                ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white hover:from-blue-700 hover:to-sky-700 shadow-lg'
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
              'Selecione os assentos'
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ConexaoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </main>
    }>
      <ConexaoPageContent />
    </Suspense>
  );
}