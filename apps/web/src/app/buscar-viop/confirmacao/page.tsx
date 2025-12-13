'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle, Download, Mail, Sparkles, Ticket, ArrowRight, MapPin, Clock, Calendar, Bus, User } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';

type ReservaStatus = 'loading' | 'success' | 'error';

type ReservaResult = {
  localizador: string;
  status: 'CONFIRMADO' | 'NEGADO';
  total: number;
  numeroBilhete?: string;
  
  // Dados da viagem
  origemNome?: string;
  destinoNome?: string;
  data?: string;
  dataFormatada?: string;
  horarioSaida?: string;
  horarioChegada?: string;
  duracaoFormatada?: string;
  
  // Dados do serviço
  empresa?: string;
  classe?: string;
  assentos?: string[];
  
  // Passageiro
  passageiro?: {
    nome: string;
    email: string;
    documento?: string;
  };
};

function ConfirmacaoContent() {
  const sp = useSearchParams();
  const orderId = sp.get('order_id');
  const status = sp.get('status');
  
  const [reservaStatus, setReservaStatus] = useState<ReservaStatus>('loading');
  const [reserva, setReserva] = useState<ReservaResult | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'paid' && status !== 'approved') {
      setReservaStatus('error');
      setErro('Pagamento não foi aprovado');
      return;
    }
    emitirBilhete();
  }, [orderId, status]);

  async function emitirBilhete() {
    try {
      setReservaStatus('loading');
      
      const res = await fetch('/api/viop/confirmar-reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao processar reserva');
      }

      const data: ReservaResult = await res.json();
      
      if (data.status === 'NEGADO') {
        throw new Error('Reserva foi negada pela operadora');
      }

      setReserva(data);
      setReservaStatus('success');
    } catch (err) {
      console.error('Erro ao emitir bilhete:', err);
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
      setReservaStatus('error');
    }
  }

  // Loading
  if (reservaStatus === 'loading') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-[2rem] shadow-2xl p-12 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-sky-600 rounded-full flex items-center justify-center shadow-2xl">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-3">
              Processando sua reserva...
            </h1>
            <p className="text-gray-600 text-lg">
              Aguarde enquanto emitimos seu bilhete
            </p>
            <div className="mt-8 flex justify-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error
  if (reservaStatus === 'error') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-[2rem] shadow-2xl p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6">
              <XCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-3">
              Ops! Algo deu errado
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              {erro || 'Não foi possível processar sua reserva'}
            </p>
            
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-sky-700 transition-all shadow-xl"
            >
              Voltar para início
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Success
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        
        {/* Header de Sucesso */}
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
            </div>
            
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
                Reserva Confirmada!
              </h1>
              <p className="text-green-100 text-lg">
                Seu bilhete foi emitido com sucesso ✨
              </p>
            </div>
          </div>

          {/* Localizador Destacado */}
          <div className="p-8 bg-gradient-to-br from-blue-50 to-sky-50">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-3">
                <Ticket className="w-6 h-6" />
                <span className="text-sm font-bold uppercase tracking-wider">Código do Localizador</span>
              </div>
              <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent mb-2 tracking-tight">
                {reserva?.localizador}
              </div>
              <p className="text-sm text-gray-600">
                Guarde este código para consultar sua viagem
              </p>
            </div>
          </div>
        </div>

        {/* Detalhes da Viagem */}
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-sky-600 px-6 py-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Bus className="w-6 h-6" />
              Detalhes da Viagem
            </h2>
          </div>

          <div className="p-8 space-y-6">
            
            {/* Rota */}
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase">Origem</span>
                </div>
                <p className="font-black text-gray-900 text-lg">
                  {reserva?.origemNome || 'Origem'}
                </p>
              </div>

              <ArrowRight className="w-8 h-8 text-blue-600 flex-shrink-0" />

              <div className="flex-1 bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-6 border-2 border-sky-200">
                <div className="flex items-center gap-2 text-sky-600 mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase">Destino</span>
                </div>
                <p className="font-black text-gray-900 text-lg">
                  {reserva?.destinoNome || 'Destino'}
                </p>
              </div>
            </div>

            {/* Grid de Informações */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Data */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold">Data</span>
                </div>
                <p className="font-black text-gray-900">
                  {reserva?.dataFormatada || reserva?.data || '—'}
                </p>
              </div>

              {/* Horário Saída */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold">Saída</span>
                </div>
                <p className="font-black text-gray-900 text-lg">
                  {reserva?.horarioSaida || '—'}
                </p>
              </div>

              {/* Horário Chegada */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold">Chegada</span>
                </div>
                <p className="font-black text-gray-900 text-lg">
                  {reserva?.horarioChegada || '—'}
                </p>
              </div>

              {/* Duração */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold">Duração</span>
                </div>
                <p className="font-black text-gray-900">
                  {reserva?.duracaoFormatada || '—'}
                </p>
              </div>
            </div>

            {/* Empresa e Classe */}
            {(reserva?.empresa || reserva?.classe) && (
              <div className="flex gap-4">
                {reserva?.empresa && (
                  <div className="flex-1 bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    <p className="text-xs text-gray-600 mb-1 font-bold">Empresa</p>
                    <p className="font-black text-gray-900">{reserva.empresa}</p>
                  </div>
                )}
                {reserva?.classe && (
                  <div className="flex-1 bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    <p className="text-xs text-gray-600 mb-1 font-bold">Classe</p>
                    <p className="font-black text-gray-900">{reserva.classe}</p>
                  </div>
                )}
              </div>
            )}

            {/* Assentos */}
            {reserva?.assentos && reserva.assentos.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-3 font-bold">Assentos Reservados:</p>
                <div className="flex flex-wrap gap-2">
                  {reserva.assentos.map((assento) => (
                    <div
                      key={assento}
                      className="bg-gradient-to-br from-blue-600 to-sky-600 text-white px-6 py-3 rounded-xl font-black text-lg shadow-lg"
                    >
                      {assento}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Passageiro */}
            {reserva?.passageiro && (
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
                <div className="flex items-center gap-2 text-gray-700 mb-4">
                  <User className="w-5 h-5" />
                  <span className="font-bold">Informações do Passageiro</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Nome:</span>
                    <span className="ml-2 font-bold text-gray-900">{reserva.passageiro.nome}</span>
                  </div>
                  {reserva.passageiro.documento && (
                    <div>
                      <span className="text-gray-600">Documento:</span>
                      <span className="ml-2 font-bold text-gray-900">{reserva.passageiro.documento}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">E-mail:</span>
                    <span className="ml-2 font-bold text-gray-900">{reserva.passageiro.email}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total Pago</span>
                <span className="text-3xl font-black">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(reserva?.total || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-sky-600 text-white px-6 py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-sky-700 transition-all shadow-xl"
          >
            <Download className="w-5 h-5" />
            Imprimir Bilhete
          </button>
          
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-900 px-6 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all"
          >
            Nova Busca
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Aviso Email */}
        {reserva?.passageiro?.email && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl px-6 py-4 flex items-center gap-3 mb-6">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              Enviamos um e-mail de confirmação para <strong>{reserva.passageiro.email}</strong>
            </p>
          </div>
        )}

        {/* Instruções */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">📋 Próximos Passos:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Chegue com <strong>30 minutos de antecedência</strong> no terminal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Leve um <strong>documento oficial com foto</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Apresente o <strong>código localizador</strong> no check-in</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Guarde este comprovante para eventuais consultas</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
    </main>
  );
}

export default function ConfirmacaoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmacaoContent />
    </Suspense>
  );
}