// apps/web/src/app/buscar-viop/confirmacao/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { Loader2, Download, MessageCircle } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';

type ReservaData = {
  localizador: string;
  numeroBilhete: string;
  total: number;
  origemNome: string;
  destinoNome: string;
  dataFormatada: string;
  horarioSaida: string;
  empresa: string;
  classe: string;
  assentos: string[];
  passageiro: {
    nome: string;
    email: string;
  };
};

function ConfirmacaoContent() {
  const sp = useSearchParams();
  const orderId = sp.get('order_id');
  const status = sp.get('status');
  
  const [loading, setLoading] = useState(true);
  const [reserva, setReserva] = useState<ReservaData | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  useEffect(() => {
    if (orderId && status === 'paid') {
      buscarDadosReserva();
    }
  }, [orderId, status]);

  async function buscarDadosReserva() {
    try {
      // 🔥 Chamar confirmar-reserva que salva no KV e retorna os dados
      const res = await fetch('/api/viop/confirmar-reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'paid' })
      });
      
      if (res.ok) {
        const data = await res.json();
        setReserva(data);
      } else {
        console.error('Erro ao buscar reserva');
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setLoading(false);
    }
  }

  async function handleBaixarBilhete() {
    setDownloadingPdf(true);
    
    try {
      const res = await fetch('/api/viop/gerar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bilhete-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao baixar bilhete');
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleEnviarWhatsApp() {
    setSendingWhatsApp(true);
    
    try {
      const res = await fetch('/api/viop/enviar-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        alert('✅ Bilhete enviado via WhatsApp com sucesso!');
      } else {
        alert('❌ Erro ao enviar WhatsApp');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao enviar WhatsApp');
    } finally {
      setSendingWhatsApp(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </main>
    );
  }

  if (!reserva) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Reserva não encontrada</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Grid 2 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          
          {/* ========== COLUNA ESQUERDA: Agradecimento ========== */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            
            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Obrigado pela sua compra
            </h1>
            
            {/* Texto confirmação */}
            <p className="text-gray-600 mb-1">
              Acabamos de enviar um e-mail de confirmação com seu bilhete anexado para{' '}
              <span className="font-semibold text-gray-900">{reserva.passageiro.email}</span>
            </p>
            
            <p className="text-sm text-gray-500 mb-8">
              Se não conseguir encontrar o bilhete, verifique sua pasta de spam.
            </p>

            {/* Botões de ação */}
            <div className="space-y-3 mb-8">
              <button
                onClick={handleBaixarBilhete}
                disabled={downloadingPdf}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Abrindo bilhete...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Baixar o bilhete
                  </>
                )}
              </button>

              <button
                onClick={handleEnviarWhatsApp}
                disabled={sendingWhatsApp}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingWhatsApp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Receber via WhatsApp
                  </>
                )}
              </button>
            </div>

            {/* Dica */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Dica:</span> Salve o bilhete no seu celular para acesso offline
              </p>
            </div>

            {/* Informações da Viagem */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informações da Viagem
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Origem</span>
                  <span className="font-medium text-gray-900">{reserva.origemNome}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Destino</span>
                  <span className="font-medium text-gray-900">{reserva.destinoNome}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Data</span>
                  <span className="font-medium text-gray-900">{reserva.dataFormatada}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Horário</span>
                  <span className="font-medium text-gray-900">{reserva.horarioSaida}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Empresa</span>
                  <span className="font-medium text-gray-900">{reserva.empresa}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Classe</span>
                  <span className="font-medium text-gray-900">{reserva.classe}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========== COLUNA DIREITA: Resumo do Pedido ========== */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Resumo do seu pedido
            </h2>

            {/* Número da Reserva */}
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-1">Número de reserva</div>
              <div className="text-2xl font-bold text-blue-600">{reserva.localizador}</div>
            </div>

            {/* Viagem */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="text-xs text-gray-500 mb-2">{reserva.dataFormatada}</div>
              <div className="font-semibold text-gray-900 mb-1">
                {reserva.origemNome} → {reserva.destinoNome}
              </div>
              <div className="text-sm text-gray-600">
                Partida: {reserva.horarioSaida}
              </div>
            </div>

            {/* Passageiro */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="text-sm text-gray-600 mb-1">1 passageiro</div>
              <div className="font-semibold text-gray-900">{reserva.passageiro.nome}</div>
              {reserva.assentos.length > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  Assento(s): {reserva.assentos.join(', ')}
                </div>
              )}
            </div>

            {/* Operadora */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="text-sm text-gray-600">
                Operado por <span className="font-medium text-gray-900">{reserva.empresa}</span>
              </div>
            </div>

            {/* Total */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-base font-semibold text-gray-700">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  R$ {reserva.total.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Incluindo todas as taxas e impostos
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
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