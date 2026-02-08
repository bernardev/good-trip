// apps/web/src/components/TripCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { UnifiedTrip } from '@/types/unified-trip';
import { formatarTempoEspera } from '@/lib/viop-types-conexoes';
import { format } from 'date-fns';
import { Clock, MapPin, ChevronRight, ChevronDown, ChevronUp, Wifi, Plug, Wind, Tv, Armchair, Info, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { getObservacaoRota, getCorObservacao } from '@/lib/observacoes-rotas';
import { SeatGrid } from './buscar/SeatGrid';
import { SeatSelectionModal } from './buscar/SeatSelectionModal';

interface TripCardProps {
  trip: UnifiedTrip;
  onSelect?: (trip: UnifiedTrip) => void;
}

type Poltrona = {
  numero: string;
  livre: boolean;
  classe?: string;
};

type TrechoComAssentos = {
  servico: string;
  origem: string;
  destino: string;
  origemNome: string;
  destinoNome: string;
  poltronas: Poltrona[];
  assentoSelecionado: string | null;
  loading: boolean;
  erro: string | null;
};

type TrechoData = {
  servico: string;
  origem: string;
  destino: string;
  origemNome: string;
  destinoNome: string;
  data: string;
};

function safeDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtTime(d: Date | null): string {
  return d ? format(d, 'HH:mm') : '--:--';
}

function getCarrierLogo(carrier: string): string {
  const normalized = carrier.toLowerCase().trim();
  const logoMap: Record<string, string> = {
    'viacao ouro e prata': '/logo-ouro-e-prata.png',
    'ouro e prata': '/logo-ouro-e-prata.png',
    'viop': '/logo-ouro-e-prata.png',
  };
  return logoMap[normalized] || '/logo-ouro-e-prata.png';
}

function getAmenityIcon(amenity: string) {
  const lower = amenity.toLowerCase();
  if (lower.includes('wifi') || lower.includes('wi-fi')) return <Wifi className="w-4 h-4" />;
  if (lower.includes('tomada') || lower.includes('plug')) return <Plug className="w-4 h-4" />;
  if (lower.includes('ar') || lower.includes('condicionado')) return <Wind className="w-4 h-4" />;
  if (lower.includes('tv')) return <Tv className="w-4 h-4" />;
  if (lower.includes('poltrona') || lower.includes('reclinavel')) return <Armchair className="w-4 h-4" />;
  return null;
}

function getBusTypeLabel(busType?: string): string {
  if (!busType) return 'Convencional';
  const type = busType.toLowerCase();
  if (type.includes('semi') || type.includes('semileito')) return 'Semi-Leito';
  if (type.includes('leito')) return 'Leito';
  if (type.includes('executivo')) return 'Executivo';
  if (type.includes('conexao') || type.includes('conexão')) return 'Conexão';
  return 'Convencional';
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

export function TripCard({ trip, onSelect }: TripCardProps) {
  const [expandido, setExpandido] = useState(false);
  const [trechos, setTrechos] = useState<TrechoComAssentos[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const departureDt = safeDate(trip.departureTime);
  const arrivalDt = safeDate(trip.arrivalTime);
  const durationHours = Math.floor(trip.duration / 60);
  const durationMinutes = trip.duration % 60;
  const durationStr = `${durationHours}h${durationMinutes > 0 ? durationMinutes.toString().padStart(2, '0') : ''}`;
  const carrierLogo = getCarrierLogo(trip.carrier);
  const busTypeLabel = getBusTypeLabel(trip.busType);
  const isConexao = !!trip.conexao;
  const observacao = getObservacaoRota(trip.departureCity, trip.arrivalCity, trip.departureTime);
  const precoFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: trip.currency,
  }).format(trip.price);

  // Extrair data da viagem
  const dataViagem = trip.departureTime ? trip.departureTime.slice(0, 10) : '';

  const handleToggleAssentos = async (): Promise<void> => {
    // 🔥 MOBILE: Abrir modal
    if (isMobile) {
      setModalAberto(true);
      return;
    }

    // 🔥 DESKTOP: Inline (comportamento original)
    if (expandido) {
      setExpandido(false);
      return;
    }

    // Se já carregou, apenas expande
    if (trechos.length > 0) {
      setExpandido(true);
      return;
    }

    // Inicializar trechos
    if (isConexao && trip.conexao) {
      // Conexão: 2 trechos
      setTrechos([
        {
          servico: trip.conexao.trechos[0].servico,
          origem: String(trip.conexao.trechos[0].origem),
          destino: String(trip.conexao.trechos[0].destino),
          origemNome: trip.conexao.trechos[0].origemDescricao,
          destinoNome: trip.conexao.trechos[0].destinoDescricao,
          poltronas: [],
          assentoSelecionado: null,
          loading: true,
          erro: null,
        },
        {
          servico: trip.conexao.trechos[1].servico,
          origem: String(trip.conexao.trechos[1].origem),
          destino: String(trip.conexao.trechos[1].destino),
          origemNome: trip.conexao.trechos[1].origemDescricao,
          destinoNome: trip.conexao.trechos[1].destinoDescricao,
          poltronas: [],
          assentoSelecionado: null,
          loading: true,
          erro: null,
        },
      ]);

      setExpandido(true);

      // Buscar assentos dos 2 trechos
      void buscarAssentos(0, trip.conexao.trechos[0].servico, String(trip.conexao.trechos[0].origem), String(trip.conexao.trechos[0].destino));
      void buscarAssentos(1, trip.conexao.trechos[1].servico, String(trip.conexao.trechos[1].origem), String(trip.conexao.trechos[1].destino));
    } else {
      // Viagem normal: 1 trecho
      const servico = trip.id.replace(/^viop-/, '').split('-')[0];
      
      setTrechos([
        {
          servico,
          origem: trip.departureCityCode || trip.departureCity,
          destino: trip.arrivalCityCode || trip.arrivalCity,
          origemNome: trip.departureCity,
          destinoNome: trip.arrivalCity,
          poltronas: [],
          assentoSelecionado: null,
          loading: true,
          erro: null,
        },
      ]);

      setExpandido(true);
      void buscarAssentos(0, servico, trip.departureCityCode || trip.departureCity, trip.arrivalCityCode || trip.arrivalCity);
    }
  };

  const buscarAssentos = async (index: number, servico: string, origem: string, destino: string): Promise<void> => {
    try {
      // 🔥 Para conexões, usar API específica de trechos
      const endpoint = isConexao ? '/api/viop/onibus-trecho' : '/api/viop/onibus';
      const url = `${endpoint}?servico=${servico}&origemId=${origem}&destinoId=${destino}&data=${dataViagem}`;
      
      
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
  };

  const selecionarAssento = (trechoIndex: number, numeroAssento: string): void => {
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

  const handleContinuar = (): void => {
    if (isConexao) {
      const assento1 = trechos[0]?.assentoSelecionado;
      const assento2 = trechos[1]?.assentoSelecionado;

      if (!assento1 || !assento2) {
        alert('Selecione um assento em cada trecho');
        return;
      }

      // 🔥 Redirecionar para identificação com dados dos 2 trechos
      // Formato: múltiplos trechos separados por ponto-e-vírgula
      const params = new URLSearchParams({
        // Dados do trecho 1
        servico1: trechos[0].servico,
        origem1: trechos[0].origem,
        destino1: trechos[0].destino,
        data1: dataViagem,
        assento1: assento1,
        // Dados do trecho 2
        servico2: trechos[1].servico,
        origem2: trechos[1].origem,
        destino2: trechos[1].destino,
        data2: dataViagem,
        assento2: assento2,
        // Flag para indicar que é conexão
        conexao: 'true',
      });

      window.location.href = `/buscar-viop/identificacao-conexao?${params.toString()}`;
    } else {
      const assento = trechos[0]?.assentoSelecionado;

      if (!assento) {
        alert('Selecione um assento');
        return;
      }

      // Viagem normal: usar fluxo existente
      const params = new URLSearchParams({
        servico: trechos[0].servico,
        origem: trechos[0].origem,
        destino: trechos[0].destino,
        data: dataViagem,
        assentos: assento,
      });

      window.location.href = `/buscar-viop/identificacao?${params.toString()}`;
    }
  };

  const todosSelecionados = isConexao
    ? trechos.length === 2 && trechos[0].assentoSelecionado && trechos[1].assentoSelecionado
    : trechos.length === 1 && trechos[0].assentoSelecionado;

  // 🔥 Preparar dados para o modal mobile
  const trechosParaModal: TrechoData[] = isConexao && trip.conexao
    ? [
        {
          servico: trip.conexao.trechos[0].servico,
          origem: String(trip.conexao.trechos[0].origem),
          destino: String(trip.conexao.trechos[0].destino),
          origemNome: trip.conexao.trechos[0].origemDescricao,
          destinoNome: trip.conexao.trechos[0].destinoDescricao,
          data: dataViagem,
        },
        {
          servico: trip.conexao.trechos[1].servico,
          origem: String(trip.conexao.trechos[1].origem),
          destino: String(trip.conexao.trechos[1].destino),
          origemNome: trip.conexao.trechos[1].origemDescricao,
          destinoNome: trip.conexao.trechos[1].destinoDescricao,
          data: dataViagem,
        },
      ]
    : [
        {
          servico: trip.id.replace(/^viop-/, '').split('-')[0],
          origem: trip.departureCityCode || trip.departureCity,
          destino: trip.arrivalCityCode || trip.arrivalCity,
          origemNome: trip.departureCity,
          destinoNome: trip.arrivalCity,
          data: dataViagem,
        },
      ];

  // 🔥 Callback quando modal completar seleção
  const handleModalComplete = (assentos: string[]): void => {
    if (isConexao) {
      // Conexão: 2 assentos
      const params = new URLSearchParams({
        servico1: trechosParaModal[0].servico,
        origem1: trechosParaModal[0].origem,
        destino1: trechosParaModal[0].destino,
        data1: dataViagem,
        assento1: assentos[0],
        servico2: trechosParaModal[1].servico,
        origem2: trechosParaModal[1].origem,
        destino2: trechosParaModal[1].destino,
        data2: dataViagem,
        assento2: assentos[1],
        conexao: 'true',
      });
      window.location.href = `/buscar-viop/identificacao-conexao?${params.toString()}`;
    } else {
      // Viagem normal: 1 assento
      const params = new URLSearchParams({
        servico: trechosParaModal[0].servico,
        origem: trechosParaModal[0].origem,
        destino: trechosParaModal[0].destino,
        data: dataViagem,
        assentos: assentos[0],
      });
      window.location.href = `/buscar-viop/identificacao?${params.toString()}`;
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden">
      <div className="p-4 md:p-5">
        
        {isConexao && trip.conexao && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-bold text-orange-900">
                1 PARADA em {trip.conexao.localidadeConexao}
              </span>
              <span className="text-xs text-orange-700 ml-2">
                ⏱️ Espera: {formatarTempoEspera(trip.conexao.tempoEspera)}
              </span>
            </div>
          </div>
        )}

        {observacao && (
          <div className={`mb-4 px-3 py-2 rounded-lg border flex items-center gap-2 ${getCorObservacao(observacao.tipo)}`}>
            <Info className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{observacao.icone} {observacao.texto}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 md:w-48 flex-shrink-0">
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {isConexao && (
                <div className="relative w-20 h-12 md:w-28 md:h-16 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <Image src="/conexao.jpg" alt="Conexão" fill className="object-cover" />
                </div>
              )}
              <div className="relative w-20 h-12 md:w-28 md:h-16 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <Image
                  src={carrierLogo}
                  alt={trip.carrier}
                  fill
                  className="object-contain p-2"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-gray-900 truncate">
                {isConexao && trip.conexao ? trip.conexao.trechos[0].empresa : trip.carrier}
              </h3>
              <span className="text-xs text-gray-600 font-medium">
                {isConexao ? 'Conexão' : busTypeLabel}
              </span>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-4">
            <div className="text-center md:text-left">
              <div className="text-2xl md:text-3xl font-black text-gray-900">{fmtTime(departureDt)}</div>
              <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                <MapPin className="w-3 h-3" />
                <span className="font-medium hidden md:inline">{trip.departureCity}</span>
              </div>
            </div>

            <div className="flex flex-col items-center px-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <Clock className="w-3 h-3" />
                <span className="font-semibold">{durationStr}</span>
              </div>
              {isConexao && trip.conexao ? (
                <div className="flex flex-col items-center w-full gap-0.5">
                  <div className="relative w-full h-0.5 bg-gray-200">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full border-2 border-white" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  </div>
                  <span className="text-[10px] text-orange-600 font-semibold mt-1">
                    via {trip.conexao.localidadeConexao}
                  </span>
                </div>
              ) : (
                <div className="relative w-full h-0.5 bg-gray-200">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-sky-400" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                </div>
              )}
            </div>

            <div className="text-center md:text-right">
              <div className="text-2xl md:text-3xl font-black text-gray-900">{fmtTime(arrivalDt)}</div>
              <div className="flex items-center justify-end gap-1 text-xs text-gray-600 mt-0.5">
                <span className="font-medium hidden md:inline">{trip.arrivalCity}</span>
                <MapPin className="w-3 h-3" />
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-2 md:w-40 flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
            <div className="flex-1 md:flex-none text-left md:text-right">
              <div className="text-xs text-gray-500 mb-0.5">A partir de</div>
              <div className="text-2xl md:text-2xl font-black text-blue-600">{precoFormatado}</div>
              {typeof trip.availableSeats === 'number' && trip.availableSeats < 10 && (
                <div className="text-xs text-red-600 font-semibold mt-0.5">
                  {trip.availableSeats} {trip.availableSeats === 1 ? 'assento' : 'assentos'}
                </div>
              )}
            </div>

            <button
              onClick={handleToggleAssentos}
              className="flex-1 md:w-full bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 group-hover:scale-105 shadow-md text-sm"
            >
              <span>{expandido ? 'Ocultar' : 'Selecionar'}</span>
              {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isConexao && trip.conexao && (
          <div className="mt-4 pt-4 border-t border-gray-100 md:hidden">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-semibold">{trip.conexao.trechos[0].origemDescricao}</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-orange-600">{trip.conexao.localidadeConexao}</span>
                <span className="text-xs text-gray-500">({trip.conexao.trechos[0].empresa})</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-semibold text-orange-600">{trip.conexao.localidadeConexao}</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold">{trip.conexao.trechos[1].destinoDescricao}</span>
                <span className="text-xs text-gray-500">({trip.conexao.trechos[1].empresa})</span>
              </div>
            </div>
          </div>
        )}

        {trip.amenities && trip.amenities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-3">
              {trip.amenities.slice(0, 6).map((amenity, index) => {
                const icon = getAmenityIcon(amenity);
                return (
                  <div key={index} className="flex items-center gap-1.5 text-xs text-gray-600" title={amenity}>
                    {icon && <span className="text-blue-500">{icon}</span>}
                    <span className="font-medium">{amenity}</span>
                  </div>
                );
              })}
              {trip.amenities.length > 6 && (
                <span className="text-xs text-gray-500">+{trip.amenities.length - 6}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 🔥 SEÇÃO EXPANDIDA - ASSENTOS (DESKTOP) */}
      {expandido && !isMobile && (
        <div className="border-t border-gray-200 bg-slate-50 p-4 md:p-6">
          {trechos.map((trecho, index) => (
            <div key={index} className={`${index > 0 ? 'mt-6 pt-6 border-t border-gray-300' : ''}`}>
              {/* Header do trecho */}
              {isConexao && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-blue-100 px-3 py-1">
                      <span className="font-black text-blue-600 text-sm">Trecho {index + 1}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {trecho.origemNome} → {trecho.destinoNome}
                    </span>
                  </div>
                  {trecho.assentoSelecionado && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-bold text-green-900">Assento {trecho.assentoSelecionado}</span>
                    </div>
                  )}
                </div>
              )}

              {trecho.loading && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Carregando assentos...</p>
                </div>
              )}

              {trecho.erro && (
                <div className="text-center py-8">
                  <p className="text-sm text-red-600">{trecho.erro}</p>
                </div>
              )}

              {!trecho.loading && !trecho.erro && trecho.poltronas.length > 0 && (
                <>
                  {/* Legenda */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mb-4 text-xs">
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

                  {/* Grid de Assentos */}
                  <SeatGrid
                    poltronas={trecho.poltronas}
                    assentoSelecionado={trecho.assentoSelecionado}
                    onSelecionarAssento={(numero) => selecionarAssento(index, numero)}
                  />
                </>
              )}
            </div>
          ))}

          {/* Botão Continuar */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleContinuar}
              disabled={!todosSelecionados}
              className={`
                px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2
                ${todosSelecionados
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              {todosSelecionados ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Continuar Reserva
                </>
              ) : (
                'Selecione os assentos'
              )}
            </button>
          </div>
        </div>
      )}

      {/* 🔥 MODAL MOBILE */}
      <SeatSelectionModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        trechos={trechosParaModal}
        onComplete={handleModalComplete}
      />
    </div>
  );
}