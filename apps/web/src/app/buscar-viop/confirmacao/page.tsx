'use client';

import { useSearchParams } from 'next/navigation';
import { Loader2, XCircle, Download, ArrowLeft } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
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
  localizadores?: string[];
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
  orgaoConcedenteId?: number;
  customizacaoRodapeCupomDeEmbarque?: string;
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

  const chaveBpeFormatada = reserva?.chaveBpe ? 
    reserva.chaveBpe.match(/.{1,4}/g)?.join(' ') || reserva.chaveBpe : '';

  const numAssentos = reserva?.assentos?.length || 1;
  const assentos = reserva?.assentos || [reserva?.poltrona || ''];
  const localizadores = reserva?.localizadores || [reserva?.localizador || ''];

  // Success - Bilhete(s) no formato 3 colunas
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
            size: A4 landscape;
            margin: 0.5cm;
          }
        }
      `}</style>

      <main className="min-h-screen bg-gray-100 py-4 px-4">
        {/* Botões superiores */}
        <div className="max-w-[1400px] mx-auto mb-4 no-print flex gap-3">
          <Link href="/" className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-300">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors ml-auto">
            <Download className="w-4 h-4" />
            Imprimir {numAssentos > 1 ? 'Bilhetes' : 'Bilhete'}
          </button>
        </div>

        {/* LOOP: Um bilhete para cada assento */}
        {assentos.map((assento, index) => {
          const localizadorAtual = localizadores[index] || reserva?.localizador || '';
          const isUltimo = index === assentos.length - 1;

          return (
            <div key={index} className={`bilhete-print ${!isUltimo ? 'page-break' : ''}`}>
              <div className="max-w-[1400px] mx-auto bg-white shadow-xl border-2 border-gray-800 mb-8">
                
                {/* LAYOUT 3 COLUNAS */}
                <div className="grid grid-cols-[380px_1fr_300px] min-h-[600px]">
                  
                  {/* ========== COLUNA 1: DADOS DA VIAGEM ========== */}
                  <div className="border-r-2 border-gray-800 p-4 text-[9px]">
                    {/* Header Viação */}
                    <div className="text-center mb-3 pb-2 border-b border-gray-300">
                      <p className="font-bold text-[11px]">{reserva?.cabecalhoEmitente?.razaoSocial}</p>
                      <p>CNPJ: {reserva?.cabecalhoEmitente?.cnpj} IE: {reserva?.cabecalhoEmitente?.inscricaoEstadual}</p>
                      <p>{reserva?.cabecalhoEmitente?.endereco}, {reserva?.cabecalhoEmitente?.numero} - {reserva?.cabecalhoEmitente?.bairro}, CEP {reserva?.cabecalhoEmitente?.cep}</p>
                      <p className="font-bold text-[10px] mt-2">Documento Auxiliar do Bilhete de Passagem Eletrônico</p>
                      <p className="mt-1">SAC: 0800 551 8666</p>
                    </div>

                    {/* Origem/Destino */}
                    <div className="mb-2">
                      <p><strong>Origem:</strong> {reserva?.origemNome}</p>
                      <p><strong>Destino:</strong> {reserva?.destinoNome}</p>
                      <p><strong>Data:</strong> {reserva?.dataFormatada}</p>
                    </div>

                    {/* Dados da viagem */}
                    <div className="mb-2 pb-2 border-b border-gray-300">
                      <p><strong>Embarque:</strong> {reserva?.dataFormatada} {reserva?.horarioSaida}</p>
                      <p><strong>Partida:</strong> {reserva?.dataFormatada} {reserva?.horarioSaida}</p>
                      <p><strong>Chegada:</strong> {reserva?.dataFormatada} {reserva?.horarioChegada}</p>
                      <p><strong>Poltrona:</strong> {assento}</p>
                      <p><strong>Serviço:</strong> {reserva?.servico}</p>
                      <p><strong>Tipo:</strong> {reserva?.classe}</p>
                      <p><strong>Prefixo:</strong> {reserva?.prefixo}</p>
                      <p><strong>Linha:</strong> {reserva?.linha}</p>
                      {reserva?.plataforma && <p><strong>Plataforma:</strong> {reserva.plataforma}</p>}
                    </div>

                    {/* Valores */}
                    <div className="mb-3 pb-2 border-b border-gray-300">
                      <p><strong>Tarifa:</strong> R$ {(reserva?.tarifa || 0).toFixed(2)}</p>
                      <p><strong>Pedágio:</strong> R$ {(reserva?.pedagio || 0).toFixed(2)}</p>
                      <p><strong>Taxa de Embarque:</strong> R$ {(reserva?.taxaEmbarque || 0).toFixed(2)}</p>
                      <p><strong>Seguro:</strong> R$ {(reserva?.seguro || 0).toFixed(2)}</p>
                      <p><strong>Outros:</strong> R$ {(reserva?.outros || 0).toFixed(2)}</p>
                      <p className="font-bold mt-1"><strong>Valor total:</strong> R$ {((reserva?.total || 0) / numAssentos).toFixed(2)}</p>
                      <p><strong>Desconto:</strong> R$ 0,00</p>
                      <p className="font-bold"><strong>Valor a Pagar:</strong> R$ {((reserva?.total || 0) / numAssentos).toFixed(2)}</p>
                    </div>

                    {/* Forma de pagamento */}
                    <div className="mb-3 pb-2 border-b border-gray-300">
                      <p className="font-bold">Forma de pagamento: Valor Pago</p>
                      <p>Vale Eletrônico WEBTEF: R$ {((reserva?.total || 0) / numAssentos).toFixed(2)}</p>
                      <p>Troco: R$ 0,00</p>
                    </div>

                    {/* Chave BPe + QR Code */}
                    <div className="mb-3 text-center">
                      <p className="text-[8px] mb-1">Consulte a chave de acesso em:</p>
                      <p className="text-[8px] text-blue-600">dfe-portal.svrs.rs.gov.br/bpe/qrcode</p>
                      <p className="font-mono text-[7px] my-2 break-all">{chaveBpeFormatada}</p>
                      {reserva?.qrCodeBpe && (
                        <div className="flex justify-center my-2">
                          <QRCodeSVG value={reserva.qrCodeBpe} size={100} level="M" />
                        </div>
                      )}
                    </div>

                    {/* QR Code Embarque (Monitriip) */}
                    <div className="mb-3 text-center pb-2 border-b border-gray-300">
                      {reserva?.qrCode && (
                        <div className="flex justify-center mb-2">
                          <QRCodeSVG value={reserva.qrCode} size={120} level="M" />
                        </div>
                      )}
                      <p className="font-bold text-[10px]">Embarque no Ônibus</p>
                      <p className="text-[8px]">(Monitriip)</p>
                    </div>

                    {/* Dados Passageiro */}
                    <div className="mb-3 pb-2 border-b border-gray-300">
                      <p><strong>Passageiro(a):</strong></p>
                      <p>Doc: {reserva?.passageiro?.documento}</p>
                      <p className="break-words">{reserva?.passageiro?.nome?.toUpperCase()}</p>
                      <p className="mt-1"><strong>Tipo de Desconto:</strong> Tarifa promocional</p>
                      <p><strong>BP-e nº:</strong> {reserva?.numeroBPe} <strong>Série:</strong> {reserva?.serie}</p>
                      <p><strong>Tipo BP-e:</strong> 0</p>
                      <p><strong>Protocolo de Autorização:</strong> {reserva?.protocolo}</p>
                      <p><strong>Data de Autorização:</strong> {reserva?.dataEmissao ? new Date(reserva.dataEmissao).toLocaleString('pt-BR') : ''}</p>
                      <p><strong>Nº Bilhete:</strong> {reserva?.numeroBilhete}</p>
                      <p><strong>Localizador:</strong> {localizadorAtual}</p>
                    </div>

                    {/* QR Code Portão */}
                    {reserva?.qrCodeTaxaEmbarque && (
                      <div className="mb-3 text-center pb-2 border-b border-gray-300">
                        <QRCodeSVG value={reserva.qrCodeTaxaEmbarque} size={100} level="M" className="mx-auto mb-2" />
                        <p className="font-bold text-[9px]">Acesso ao Portão de Embarque</p>
                      </div>
                    )}

                    {/* Rodapé */}
                    <div className="text-center text-[8px]">
                      <p className="font-bold mb-2">Passageiro, consulte seus direitos e deveres</p>
                      <div className="flex justify-center mb-2">
                        <QRCodeSVG value="https://www.viacaoouroepratacom.br/guia-passageiros" size={60} level="M" />
                      </div>
                      <p>Aponte a câmera do seu celular ou acesse</p>
                      <p className="text-blue-600 mt-1">Obtenha um livreto aqui</p>
                    </div>
                  </div>

                  {/* ========== COLUNA 2: REGRAS E DIREITOS ========== */}
                  <div className="p-4 text-[8px] leading-relaxed">
                    {reserva?.customizacaoRodapeCupomDeEmbarque ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: reserva.customizacaoRodapeCupomDeEmbarque }}
                        className="text-[8px] leading-relaxed"
                      />
                    ) : (
                      <>
                        <p className="text-center text-[9px] mb-3">
                          Os direitos e deveres dos passageiros podem ser consultados através do Guia de Orientação aos Passageiros, disponíveis no formato digital nos guichês, ônibus e site da empresa.
                        </p>

                        <p className="font-bold text-[9px] mb-2">REGRAS PARA TRANSFERÊNCIA E REMARCAÇÃO:</p>

                        <div className="space-y-2">
                          <div>
                            <p className="font-bold">Cancelamento e Reembolso:</p>
                            <p>O passageiro pode solicitar cancelamento e reembolso até 3 horas antes da viagem. <strong>Não Comparecimento:</strong> Se o passageiro não comparecer e não cancelar até 3 horas antes da viagem, perderá o direito ao reembolso.</p>
                          </div>

                          <div>
                            <p className="font-bold">Devolução do Valor:</p>
                            <p>A empresa devolve o valor pago em até 30 dias após o pedido, com retenção de 5% como multa.</p>
                          </div>

                          <div>
                            <p className="font-bold">Reembolso Integral:</p>
                            <p>Passageiros que comprarem bilhetes online têm direito a reembolso integral se solicitarem cancelamento em até 7 dias após a compra, desde que a viagem não comece em menos de 3 horas.</p>
                          </div>

                          <div>
                            <p className="font-bold">Taxa de Remarcação:</p>
                            <p>Se a remarcação for feita após 3 horas antes da viagem, será cobrada uma taxa de 20% do valor pago.</p>
                          </div>

                          <div>
                            <p className="font-bold">Diferença de Valor:</p>
                            <p>Em caso de remarcação, o passageiro paga ou recebe a diferença entre o valor pago e o novo valor.</p>
                          </div>

                          <div>
                            <p className="font-bold">Remarcação Após 3 Horas:</p>
                            <p>Após 3 horas antes da viagem, a passagem só pode ser remarcada para a mesma origem e destino.</p>
                          </div>

                          <div>
                            <p className="font-bold">Troca de Trecho:</p>
                            <p>A troca de trecho requer antecedência mínima de 3 horas antes da viagem, e nenhuma remarcação fora do prazo de 3 horas.</p>
                          </div>

                          <div>
                            <p className="font-bold">Transferibilidade:</p>
                            <p>Bilhetes são nominais e podem ser transferíveis, salvo disposição contrária.</p>
                          </div>

                          <div>
                            <p className="font-bold">Gratuidades e Descontos:</p>
                            <p>Bilhetes emitidos com gratuidades e descontos legais são intransferíveis.</p>
                          </div>
                        </div>
                      </>
                    )}

                    {reserva?.orgaoConcedenteId === 3 && (
                      <div className="mt-4 pt-3 border-t border-gray-300 text-center">
                        <p className="font-bold mb-2">Para ler o guia do passageiro completo acesse pelo QRCode abaixo</p>
                        <div className="flex justify-center">
                          <QRCodeSVG value="https://www.viacaoouroepratacom.br/guia-passageiros" size={80} level="M" />
                        </div>
                        <p className="mt-2 text-blue-600">https://www.viacaoouroepratacom.br/guia-passageiros</p>
                      </div>
                    )}
                  </div>

                  {/* ========== COLUNA 3: PASSAGEM DIGITAL ========== */}
                  <div className="border-l-2 border-gray-800 p-4 text-[9px] flex flex-col">
                    <p className="text-center font-bold text-[11px] mb-3">Passagem Digital</p>

                    {/* Código de barras (simulado) */}
                    <div className="mb-3 text-center">
                      <svg width="100%" height="60" className="mx-auto">
                        <rect width="100%" height="100%" fill="white"/>
                        {[...Array(40)].map((_, i) => (
                          <rect 
                            key={i} 
                            x={i * 6} 
                            y="10" 
                            width={Math.random() > 0.5 ? 2 : 4} 
                            height="40" 
                            fill="black"
                          />
                        ))}
                      </svg>
                    </div>

                    <p className="text-center text-[8px] mb-3 border-t border-b border-dashed border-gray-400 py-2">
                      Use esse documento para embarcar direto
                    </p>

                    {/* Dados da viagem */}
                    <div className="space-y-1 mb-3">
                      <p><strong>Origem:</strong></p>
                      <p>{reserva?.origemNome}</p>
                      <p className="text-[8px]">Local de Embarque: {reserva?.origemNome}</p>
                      
                      <p className="mt-2"><strong>Destino:</strong></p>
                      <p>{reserva?.destinoNome}</p>
                      <p className="text-[8px]">Local de Desembarque: {reserva?.destinoNome}</p>

                      <p className="mt-2"><strong>Linha:</strong></p>
                      <p>{reserva?.linha}</p>

                      <p className="mt-2"><strong>Data da viagem:</strong> {reserva?.dataFormatada}</p>
                      <p><strong>Hora da viagem:</strong> {reserva?.horarioSaida}</p>
                      
                      <p className="mt-2 text-[8px]">
                        <strong>Horário Início Embarque:</strong> {reserva?.dataHoraEmbarqueInicio} / 
                        <strong> Horário Fim Embarque:</strong> {reserva?.dataHoraEmbarqueFim}
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p><strong>Poltrona:</strong></p>
                          <p className="text-[16px] font-bold">{assento}</p>
                        </div>
                        <div>
                          <p><strong>Plataforma:</strong></p>
                          <p className="text-[16px] font-bold">{reserva?.plataforma || '-'}</p>
                        </div>
                      </div>

                      <p className="mt-2"><strong>Nome:</strong></p>
                      <p className="break-words">{reserva?.passageiro?.nome?.toUpperCase()}</p>

                      <p className="mt-2"><strong>Documento:</strong></p>
                      <p>{reserva?.passageiro?.documento}</p>

                      <p className="mt-2 text-[8px]"><strong>Nº Bilhete/BP-e:</strong> {reserva?.numeroBilhete}</p>
                      <p className="text-[8px]"><strong>Tipo:</strong> {reserva?.serie}</p>
                      <p className="text-[8px]"><strong>Viação:</strong> {reserva?.cabecalhoEmitente?.razaoSocial}</p>
                    </div>

                    {/* QR Code Rodoviária */}
                    <div className="mt-auto text-center">
                      <p className="font-bold text-[10px] mb-2">Rodoviária</p>
                      {reserva?.qrCodeTaxaEmbarque && (
                        <div className="flex justify-center mb-2">
                          <QRCodeSVG value={reserva.qrCodeTaxaEmbarque} size={100} level="M" />
                        </div>
                      )}
                      <p className="text-[8px]">Para embarcar na rodoviária</p>
                      <p className="text-[8px] mt-1"><strong>Localizador:</strong></p>
                      <p className="font-bold text-[10px]">{localizadorAtual}</p>
                      <p className="text-[7px] text-blue-600 mt-2">www.viacaoouroepratacom.br/site</p>
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