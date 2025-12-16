'use client';

import { useSearchParams } from 'next/navigation';
import { Loader2, XCircle, Download, ArrowLeft } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';

type ReservaStatus = 'loading' | 'success' | 'error';

type ReservaResult = {
  localizador: string;
  status: 'CONFIRMADO' | 'NEGADO';
  total: number;
  numeroBilhete?: string;
  numeroSistema?: string;
  origemNome?: string;
  destinoNome?: string;
  data?: string;
  dataFormatada?: string;
  horarioSaida?: string;
  horarioChegada?: string;
  duracaoFormatada?: string;
  empresa?: string;
  classe?: string;
  assentos?: string[];
  servico?: string;
  passageiro?: {
    nome: string;
    email: string;
    documento?: string;
  };
  xmlBPE?: {
    chaveBpe?: string;
    qrcode?: string;
    qrcodeBpe?: string;
  };
  qrCode?: string;
  qrCodeBpe?: string;
  chaveBpe?: string;
  taxaEmbarque?: number;
  pedagio?: number;
  tarifa?: number;
  outros?: number;
  seguro?: number;
  protocolo?: string;
  dataEmissao?: string;
  serie?: string;
  numeroBPe?: string;
  _teste?: boolean;
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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Emitindo seu bilhete...</h2>
          <p className="text-gray-600">Aguarde enquanto processamos sua reserva</p>
        </div>
      </main>
    );
  }

  // Error
  if (reservaStatus === 'error') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao emitir bilhete</h2>
          <p className="text-gray-600 mb-6">{erro}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para início
          </Link>
        </div>
      </main>
    );
  }

  // Extrair dados
  const chaveBpe = reserva?.chaveBpe || reserva?.xmlBPE?.chaveBpe || '';
  const qrCodePortao = reserva?.qrCode || reserva?.xmlBPE?.qrcode || '';
  const qrCodeBpe = reserva?.qrCodeBpe || reserva?.xmlBPE?.qrcodeBpe || '';
  
  // Gerar QR Codes de teste se necessário
  const isTeste = reserva?._teste || (!chaveBpe && !qrCodePortao && !qrCodeBpe);
  const chaveBpeTeste = isTeste ? `SIMULADO_CHAVE_BPE_${reserva?.localizador || 'TESTE'}` : chaveBpe;
  const qrCodePortaoTeste = isTeste ? `https://goodtrip.com.br/portao/${reserva?.localizador || 'TESTE'}` : qrCodePortao;
  const qrCodeBpeTeste = isTeste ? `http://bpe.svrs.rs.gov.br/consulta?chave=${chaveBpeTeste}` : qrCodeBpe;
  
  // Formatar chave BPe para código de barras (espaços a cada 4 dígitos)
  const chaveBpeFormatada = (chaveBpeTeste || chaveBpe).match(/.{1,4}/g)?.join(' ') || (chaveBpeTeste || chaveBpe);

  // Success - Bilhete Eletrônico
  return (
    <>
      {/* Estilos para impressão */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          #bilhete-eletronico {
            box-shadow: none !important;
            border: 1px solid #000 !important;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          /* Forçar tudo em 1 página */
          #bilhete-eletronico * {
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
          @page {
            margin: 0.5cm;
            size: A4 portrait;
          }
          /* Reduzir tamanhos para caber em 1 página */
          #bilhete-eletronico {
            font-size: 11px !important;
            transform: scale(0.95);
            transform-origin: top center;
          }
          #bilhete-eletronico h1 {
            font-size: 16px !important;
          }
          #bilhete-eletronico h2 {
            font-size: 14px !important;
          }
          #bilhete-eletronico .text-sm {
            font-size: 10px !important;
          }
          #bilhete-eletronico .text-xs {
            font-size: 9px !important;
          }
          #bilhete-eletronico .p-6 {
            padding: 10px !important;
          }
          #bilhete-eletronico .p-4 {
            padding: 8px !important;
          }
          #bilhete-eletronico .mb-4, #bilhete-eletronico .mb-3 {
            margin-bottom: 6px !important;
          }
          #bilhete-eletronico .gap-6 {
            gap: 10px !important;
          }
          #bilhete-eletronico img {
            max-width: 100px !important;
            height: auto !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-gray-100 py-8 px-4">
        {/* Botões superiores - não imprimem */}
        <div className="max-w-4xl mx-auto mb-4 no-print flex gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          
          {/* BOTÃO WHATSAPP */}
          <button
            onClick={() => {
              const whatsappText = `🎫 *Bilhete Good Trip*\n\n📍 ${reserva?.origemNome} → ${reserva?.destinoNome}\n📅 ${reserva?.dataFormatada}\n🕐 ${reserva?.horarioSaida}\n💺 Assento(s): ${reserva?.assentos?.join(', ')}\n🔢 Localizador: *${reserva?.localizador}*\n\n✅ Passagem confirmada!\n\nAcesse: ${window.location.href}`;
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Enviar WhatsApp
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors ml-auto"
          >
            <Download className="w-4 h-4" />
            Imprimir Bilhete
          </button>
        </div>

        {/* Bilhete Eletrônico */}
        <div id="bilhete-eletronico" className="max-w-4xl mx-auto bg-white shadow-xl border border-gray-300">
          
          {/* CABEÇALHO */}
          <div className="border-b-2 border-gray-300 p-6">
            <div className="flex items-start gap-6 mb-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Image 
                  src="/logo-goodtrip.jpeg" 
                  alt="Good Trip" 
                  width={120} 
                  height={120}
                  className="object-contain"
                />
              </div>
              
              {/* Dados da empresa */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">GOOD TRIP PASSAGENS LTDA</h1>
                <p className="text-sm text-gray-700">CNPJ: 57.355.709/0001-27</p>
                <p className="text-sm text-gray-700">Rodovia Transamazônica, SN, Box 09, Bairro Bela Vista</p>
                <p className="text-sm text-gray-700">Itaituba – PA, CEP 68180-010</p>
              </div>
              
              {/* SAC */}
              <div className="text-right text-sm text-gray-600">
                <p>SAC: (93) 99143-6570</p>
                <p>suporte@goodtrip.com.br</p>
              </div>
            </div>
            <h2 className="text-lg font-bold text-center text-gray-900 border-t pt-3">
              Documento Auxiliar do Bilhete de Passagem Eletrônico
            </h2>
          </div>

          {/* DADOS DA VIAGEM */}
          <div className="border-b-2 border-gray-300 p-6">
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">Origem: {reserva?.origemNome}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">Destino: {reserva?.destinoNome}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Data:</p>
                <p className="font-bold text-gray-900">{reserva?.dataFormatada || reserva?.data}</p>
              </div>
              <div>
                <p className="text-gray-600">Embarque:</p>
                <p className="font-bold text-gray-900">{reserva?.dataFormatada} {reserva?.horarioSaida}</p>
              </div>
              <div>
                <p className="text-gray-600">Poltrona:</p>
                <p className="font-bold text-gray-900 text-xl">{reserva?.assentos?.[0]}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mt-3">
              <div>
                <p className="text-gray-600">Serviço:</p>
                <p className="font-bold text-gray-900">{reserva?.servico}</p>
              </div>
              <div>
                <p className="text-gray-600">Tipo:</p>
                <p className="font-bold text-gray-900">{reserva?.classe || 'EXECUTIVO'}</p>
              </div>
              <div>
                <p className="text-gray-600">Tipo Viagem:</p>
                <p className="font-bold text-gray-900">HORARIO ORDINARIO</p>
              </div>
            </div>

            <div className="mt-3 text-sm">
              <p className="text-gray-600">Linha:</p>
              <p className="font-bold text-gray-900">{reserva?.empresa}</p>
            </div>
          </div>

          {/* VALORES */}
          <div className="border-b-2 border-gray-300 p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Tarifa:</span>
                  <span className="font-semibold">R$ {(reserva?.tarifa || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Pedágio:</span>
                  <span className="font-semibold">R$ {(reserva?.pedagio || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Taxa de Embarque:</span>
                  <span className="font-semibold">R$ {(reserva?.taxaEmbarque || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Outros:</span>
                  <span className="font-semibold">R$ {(reserva?.outros || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Seguro:</span>
                  <span className="font-semibold">R$ {(reserva?.seguro || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Imposto:</span>
                  <span className="font-semibold">R$ 0,00</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span className="text-gray-900">Valor Total:</span>
                  <span>R$ {(reserva?.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Desconto:</span>
                  <span className="font-semibold">R$ 0,00</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-gray-900">Valor a Pagar:</span>
                  <span>R$ {(reserva?.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t text-sm">
              <div className="flex justify-between mb-1">
                <span className="font-bold text-gray-900">FORMA PAGAMENTO:</span>
                <span className="font-bold">VALOR PAGO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Crédito:</span>
                <span className="font-semibold">R$ {(reserva?.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Troco:</span>
                <span className="font-semibold">R$ 0,00</span>
              </div>
            </div>
          </div>

          {/* CHAVE BPe E CÓDIGO DE BARRAS */}
          {(chaveBpeTeste || chaveBpe) && (
            <div className="border-b-2 border-gray-300 p-6 text-center">
              <p className="text-xs text-gray-600 mb-2">Consulta pela Chave de Acesso em</p>
              <p className="text-xs text-blue-600 mb-3">http://bpe.svrs.rs.gov.br/consulta</p>
              <div className="font-mono text-lg font-bold tracking-wider text-gray-900 mb-3">
                {chaveBpeFormatada}
              </div>
              {isTeste && (
                <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs py-2 px-4 rounded mb-3">
                  ⚠️ BILHETE DE TESTE - Chave simulada para visualização
                </div>
              )}
              {/* Área para código de barras */}
              <div className="h-20 bg-gray-100 flex items-center justify-center border border-gray-300">
                <p className="text-xs text-gray-500">Código de Barras: {(chaveBpeTeste || chaveBpe).substring(0, 20)}...</p>
              </div>
            </div>
          )}

          {/* DADOS PASSAGEIRO E QR CODE BPe */}
          <div className="border-b-2 border-gray-300 p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* QR Code Esquerda */}
              <div className="flex items-center justify-center">
                {qrCodeBpeTeste || qrCodeBpe ? (
                  isTeste ? (
                    <QRCodeSVG value={qrCodeBpeTeste} size={192} level="M" />
                  ) : (
                    <img src={qrCodeBpe} alt="QR Code BPe" className="w-48 h-48" />
                  )
                ) : (
                  <div className="w-48 h-48 bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                    <p className="text-xs text-gray-500 text-center">QR Code BPe</p>
                  </div>
                )}
              </div>

              {/* Dados Passageiro */}
              <div className="text-sm space-y-2">
                <div>
                  <p className="text-gray-600">Passageiro(a)</p>
                  <p className="font-bold text-gray-900">
                    DOC {reserva?.passageiro?.documento} - {reserva?.passageiro?.nome?.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">TIPO DE DESCONTO</p>
                  <p className="font-semibold text-gray-900">Normal</p>
                </div>
                <div>
                  <p className="text-gray-600">Documento de desconto</p>
                  <p className="font-semibold text-gray-900">---</p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-gray-600">BP-e nº: {reserva?.numeroBPe || reserva?.numeroBilhete} Série: {reserva?.serie || '001'}</p>
                  <p className="text-gray-600">Data de emissão: {reserva?.dataEmissao || new Date().toLocaleString('pt-BR')}</p>
                  {reserva?.protocolo && (
                    <p className="text-gray-600">Protocolo de autorização: {reserva.protocolo}</p>
                  )}
                  <p className="text-gray-600">Nº bilhete: {reserva?.numeroBilhete}</p>
                  <p className="text-gray-600">Localizador: {reserva?.localizador}</p>
                </div>
              </div>
            </div>
          </div>

          {/* TRIBUTOS */}
          <div className="border-b-2 border-gray-300 p-4 text-xs text-gray-700">
            <p>
              Tributos Totais Incidentes (Lei Federal nº 12.741/2012) - 
              ICMS: R$ {((reserva?.total || 0) * 0.17).toFixed(2)} (17,00%) 
              OUTROS TRIB: R$ {((reserva?.total || 0) * 0.02).toFixed(2)} (2,00%)
            </p>
            <p className="mt-1">
              Horário de início do embarque {reserva?.dataFormatada} {reserva?.horarioSaida}. 
              Horário final do embarque: {reserva?.dataFormatada} {reserva?.horarioSaida ? 
                `${reserva.horarioSaida.split(':')[0]}:${(parseInt(reserva.horarioSaida.split(':')[1]) + 29).toString().padStart(2, '0')}` 
                : ''}
            </p>
          </div>

          {/* QR CODE PORTÃO EMBARQUE */}
          <div className="border-b-2 border-gray-300 p-6 text-center">
            {qrCodePortaoTeste || qrCodePortao ? (
              isTeste ? (
                <QRCodeSVG value={qrCodePortaoTeste} size={192} level="M" className="mx-auto mb-2" />
              ) : (
                <img src={qrCodePortao} alt="Acesso Portão Embarque" className="w-48 h-48 mx-auto mb-2" />
              )
            ) : (
              <div className="w-48 h-48 bg-gray-100 border-2 border-gray-300 flex items-center justify-center mx-auto mb-2">
                <p className="text-xs text-gray-500">QR Code Portão</p>
              </div>
            )}
            {isTeste && (
              <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs py-2 px-4 rounded mb-2 inline-block">
                ⚠️ QR Code de teste para visualização
              </div>
            )}
            <p className="font-bold text-gray-900">Acesso ao Portão de Embarque</p>
          </div>

          {/* ORIENTAÇÕES */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <p className="font-bold text-gray-900 mb-2">Passageiro, consulte seus direitos e deveres</p>
                <p className="text-gray-700 mb-2">Aponte a câmera do seu celular ou acesse</p>
                <p className="text-blue-600 underline mb-1">www.goodtrip.com.br/direitos</p>
                <p className="text-gray-600 italic">Artigo 143, Item VII da Resolução 6.033 de 21 de dezembro de 2023</p>
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-2">Beneficiários de Passe Livre Idosos e ID Jovem</p>
                <p className="text-gray-700 mb-2">
                  É obrigatório o comparecimento para o embarque com pelo menos 30 minutos antes da hora da partida prevista. 
                  Também é obrigatória a apresentação dos documentos que comprovam o direito ao benefício no momento do embarque. 
                  O não cumprimento destas orientações poderá acarretar a perda do benefício.
                </p>
                <p className="text-gray-600 italic">Artigo 143, parágrafos 1º e 2º da Resolução 6.033 de 21 de dezembro de 2023</p>
              </div>
            </div>
          </div>

          {/* RODAPÉ */}
          <div className="bg-gray-100 p-4 text-center text-xs text-gray-600 border-t-2 border-gray-300">
            <p>Good Trip Passagens - www.goodtrip.com.br</p>
          </div>
        </div>
      </main>
    </>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
    </main>
  );
}

export default function BilheteEletronicoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmacaoContent />
    </Suspense>
  );
}