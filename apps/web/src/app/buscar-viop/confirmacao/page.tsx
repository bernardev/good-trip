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
  localizadores?: string[]; // 🔥 Array de localizadores
  servico?: string;
  poltrona?: string;
  passageiro?: {
    nome: string;
    email: string;
    documento?: string;
  };
  qrCode?: string;
  qrCodeBpe?: string;
  qrCodeTaxaEmbarque?: string;
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
  prefixo?: string;
  plataforma?: string;
  linha?: string;
  cabecalhoAgencia?: {
    razaoSocial: string;
    cnpj: string;
    endereco: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  cabecalhoEmitente?: {
    razaoSocial: string;
    cnpj: string;
    inscricaoEstadual: string;
    endereco: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  dataHoraEmbarqueInicio?: string;
  dataHoraEmbarqueFim?: string;
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

  const isTeste = reserva?._teste === true;
  const chaveBpeFormatada = reserva?.chaveBpe ? reserva.chaveBpe.match(/.{1,4}/g)?.join(' ') || reserva.chaveBpe : '';

  // 🔥 Múltiplos bilhetes (um para cada assento)
  const numAssentos = reserva?.assentos?.length || 1;
  const assentos = reserva?.assentos || [reserva?.poltrona || ''];
  const localizadores = reserva?.localizadores || [reserva?.localizador || ''];

  // Success - Bilhete(s) Eletrônico(s)
  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .bilhete-print, .bilhete-print * { visibility: visible; }
          .bilhete-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
          @page { 
            size: A4 portrait; 
            margin: 1cm; 
          }
        }
      `}</style>

      <main className="min-h-screen bg-gray-100 py-4 px-4">
        {/* Botões superiores */}
        <div className="max-w-4xl mx-auto mb-4 no-print flex gap-3">
          <Link href="/" className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-300">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          
          <button
            onClick={() => {
              const whatsappText = `🎫 *Bilhetes Good Trip*\n\n📍 ${reserva?.origemNome} → ${reserva?.destinoNome}\n📅 ${reserva?.dataFormatada}\n🕐 ${reserva?.horarioSaida}\n💺 Assentos: ${assentos.join(', ')}\n🔢 Localizadores: ${localizadores.join(', ')}\n\n✅ Passagens confirmadas!`;
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

          <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors ml-auto">
            <Download className="w-4 h-4" />
            Imprimir {numAssentos > 1 ? 'Bilhetes' : 'Bilhete'}
          </button>
        </div>

        {/* Aviso de Teste */}
        {isTeste && (
          <div className="max-w-4xl mx-auto mb-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 no-print">
            <p className="text-yellow-800 font-bold text-center">
              ⚠️ ATENÇÃO: {numAssentos > 1 ? 'Estes são bilhetes de TESTE' : 'Este é um bilhete de TESTE'}. Não {numAssentos > 1 ? 'são válidos' : 'é válido'} para embarque.
            </p>
          </div>
        )}

        {/* 🔥 LOOP: Um bilhete para cada assento */}
        {assentos.map((assento, index) => {
          const localizadorAtual = localizadores[index] || reserva?.localizador || '';
          const isUltimo = index === assentos.length - 1;

          return (
            <div key={index} className={`bilhete-print ${!isUltimo ? 'page-break' : ''}`}>
              <div className="max-w-4xl mx-auto bg-white shadow-xl border border-gray-300 mb-8">
                
                {/* Badge de bilhete múltiplo */}
                {numAssentos > 1 && (
                  <div className="bg-blue-600 text-white text-center py-2 font-bold">
                    Bilhete {index + 1} de {numAssentos}
                  </div>
                )}

                {/* CABEÇALHO AGÊNCIA */}
                <div className="border-b flex items-start gap-2 p-4">
                  <Image src="/logo-goodtrip.jpeg" alt="Good Trip" width={50} height={50} className="object-contain" />
                  <div className="flex-1">
                    <p className="font-bold text-xs">{reserva?.cabecalhoAgencia?.razaoSocial || 'GOOD TRIP TRANSPORTE E TURISMO LTDA'}</p>
                    <p className="text-xs">{reserva?.cabecalhoAgencia?.cnpj || '38.627.614/0001-70'}</p>
                    <p className="text-xs">{reserva?.cabecalhoAgencia?.endereco || 'AG GETULIO VARGAS'}, {reserva?.cabecalhoAgencia?.numero || '519'} - {reserva?.cabecalhoAgencia?.bairro || 'CENTRO'}</p>
                    <p className="text-xs">{reserva?.cabecalhoAgencia?.cidade || 'ITAITUBA'} - {reserva?.cabecalhoAgencia?.uf || 'PA'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs">Whatsapp: (93) 99143-6570</p>
                    <p className="text-xs">E-mail: suporte@goodtrip.com.br</p>
                  </div>
                </div>

                {/* CABEÇALHO EMITENTE */}
                <div className="border-b bg-gray-50 p-4 text-center">
                  <p className="font-bold text-xs">{reserva?.cabecalhoEmitente?.razaoSocial}</p>
                  <p className="text-xs">CNPJ: {reserva?.cabecalhoEmitente?.cnpj} IE: {reserva?.cabecalhoEmitente?.inscricaoEstadual}</p>
                  <p className="text-xs">{reserva?.cabecalhoEmitente?.endereco}, {reserva?.cabecalhoEmitente?.numero} - {reserva?.cabecalhoEmitente?.bairro} | CIDADE | ESTADO: {reserva?.cabecalhoEmitente?.cidade} | {reserva?.cabecalhoEmitente?.uf} CEP: {reserva?.cabecalhoEmitente?.cep}</p>
                  <p className="font-bold text-sm mt-2">Documento Auxiliar do Bilhete de Passagem Eletrônico</p>
                  <p className="text-xs mt-1">SAC: 0800 551 8666</p>
                </div>

                {/* ORIGEM E DESTINO */}
                <div className="border-b p-4">
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <div>Origem: {reserva?.origemNome}</div>
                    <div>Destino: {reserva?.destinoNome}</div>
                  </div>
                  <p className="text-center text-sm font-bold">Data: {reserva?.dataFormatada}</p>
                </div>

                {/* DADOS DA VIAGEM */}
                <div className="border-b p-4 text-center">
                  <div className="grid grid-cols-4 gap-3 mb-3 text-xs">
                    <div className="text-left">
                      <p><strong>Embarque:</strong> {reserva?.dataFormatada} {reserva?.horarioSaida}</p>
                    </div>
                    <div>
                      <p><strong>Partida:</strong> {reserva?.dataFormatada} {reserva?.horarioSaida}</p>
                    </div>
                    <div>
                      <p><strong>Chegada:</strong> {reserva?.dataFormatada} {reserva?.horarioChegada}</p>
                    </div>
                    <div className="text-right">
                      <p><strong>Poltrona:</strong> {assento}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-xs mb-2">
                    <div><p><strong>Serviço:</strong> {reserva?.servico}</p></div>
                    <div><p><strong>Tipo:</strong> {reserva?.classe}</p></div>
                    <div><p><strong>Prefixo:</strong> {reserva?.prefixo}</p></div>
                  </div>
                  
                  <div className="text-xs">
                    <p><strong>Linha:</strong> {reserva?.linha}</p>
                    {reserva?.plataforma && <p className="mt-1"><strong>Plataforma:</strong> {reserva.plataforma}</p>}
                  </div>
                </div>

                {/* VALORES (por assento) */}
                <div className="border-b p-4 text-center text-xs">
                  <div className="space-y-1">
                    <p><strong>Tarifa:</strong> R$ {(reserva?.tarifa || 0).toFixed(2)}</p>
                    <p><strong>Pedágio:</strong> R$ {(reserva?.pedagio || 0).toFixed(2)}</p>
                    <p><strong>Embarque:</strong> R$ {(reserva?.taxaEmbarque || 0).toFixed(2)}</p>
                    <p><strong>Seguro:</strong> R$ {(reserva?.seguro || 0).toFixed(2)}</p>
                    <p><strong>Outros:</strong> R$ {(reserva?.outros || 0).toFixed(2)}</p>
                    <p className="font-bold text-sm pt-2"><strong>Valor Total (este assento):</strong> R$ {((reserva?.total || 0) / numAssentos).toFixed(2)}</p>
                    <p><strong>Desconto:</strong> R$ 0,00</p>
                    <p className="font-bold text-sm"><strong>Valor a Pagar:</strong> R$ {((reserva?.total || 0) / numAssentos).toFixed(2)}</p>
                    <p className="font-bold pt-2">FORMA PAGAMENTO: VALOR PAGO</p>
                    <p><strong>Crédito DT:</strong> R$ {((reserva?.total || 0) / numAssentos).toFixed(2)}</p>
                    <p><strong>Troco:</strong> R$ 0,00</p>
                  </div>
                </div>

                {/* CHAVE BPe */}
                <div className="border-b p-4 text-center">
                  <p className="text-xs mb-1">Consulta pela Chave de Acesso em</p>
                  <p className="text-xs text-blue-600">http://bpe.svrs.rs.gov.br/consulta</p>
                  <p className="font-mono text-xs my-2">{chaveBpeFormatada}</p>
                  <div className="flex justify-center my-3">
                    {reserva?.qrCodeBpe && <QRCodeSVG value={reserva.qrCodeBpe} size={120} level="M" />}
                  </div>
                </div>

                {/* QR CODE EMBARQUE E DADOS PASSAGEIRO */}
                <div className="border-b p-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col items-center">
                      {reserva?.qrCode && <QRCodeSVG value={reserva.qrCode} size={140} level="M" />}
                      <p className="font-bold text-sm mt-3">Embarque no Ônibus</p>
                      <p className="text-xs">(Monitriip)</p>
                    </div>
                    <div className="text-xs">
                      <p><strong>Passageiro(a)</strong> DOC {reserva?.passageiro?.documento} - {reserva?.passageiro?.nome?.toUpperCase()}</p>
                      <p className="mt-2"><strong>TIPO DE DESCONTO</strong> Normal</p>
                      <p><strong>Documento de desconto</strong> ---</p>
                      <div className="mt-4 pt-3 border-t">
                        <p><strong>BP-e nº:</strong> {reserva?.numeroBPe} <strong>Série:</strong> {reserva?.serie}</p>
                        <p className="mt-1"><strong>Data de emissão:</strong> {reserva?.dataEmissao ? new Date(reserva.dataEmissao).toLocaleString('pt-BR') : ''}</p>
                        <p className="mt-1"><strong>Protocolo de autorização:</strong> {reserva?.protocolo}</p>
                        <p className="mt-1"><strong>Nº bilhete:</strong> {reserva?.numeroBilhete}</p>
                        <p className="mt-1"><strong>Localizador:</strong> {localizadorAtual}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR CODE PORTÃO */}
                {reserva?.qrCodeTaxaEmbarque && (
                  <div className="border-b p-4 text-center">
                    <QRCodeSVG value={reserva.qrCodeTaxaEmbarque} size={120} level="M" className="mx-auto" />
                    <p className="font-bold text-sm mt-3">Acesso ao Portão de Embarque</p>
                  </div>
                )}

                {/* RODAPÉ */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-6 text-xs">
                    <div>
                      <p className="font-bold mb-3">Passageiro, consulte seus direitos e deveres</p>
                      <div className="flex justify-center my-3">
                        <QRCodeSVG value="https://www.goodtrip.com.br/direitos" size={80} level="M" />
                      </div>
                      <p className="mt-2">Aponte a câmera do seu celular ou acesse</p>
                      <p className="text-blue-600 underline mt-1">Obtenha um livreto aqui</p>
                      <p className="mt-3">Artigo 143, Item VII da Resolução 6.033 de 21 de dezembro de 2023</p>
                    </div>
                    <div>
                      <p className="font-bold mb-3">Beneficiários de Passe Livre Idosos e ID Jovem</p>
                      <p className="leading-relaxed">É obrigatório o comparecimento para o embarque com pelo menos 30 minutos antes da hora da partida prevista. Também é obrigatória a apresentação dos documentos que comprovam o direito ao benefício no momento do embarque. O não cumprimento destas orientações poderá acarretar a perda do benefício.</p>
                      <p className="mt-3">Artigo 143, parágrafos 1º e 2º da Resolução 6.033 de 21 de dezembro de 2023</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
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