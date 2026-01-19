'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

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
  
  // 🔥 NOVOS
  orgaoConcedenteId?: number;
  customizacaoRodapeCupomDeEmbarque?: string;
  
  _teste?: boolean;
};

const DADOS_MOCK: ReservaResult = {
  localizador: 'MHGMHYJ',
  status: 'CONFIRMADO',
  numeroBilhete: '10000033475238',
  numeroSistema: '549188',
  origemNome: 'ITAITUBA - PA',
  destinoNome: 'KM 30 (CAMPO VERDE) - PA',
  data: '2026-01-29',
  dataFormatada: '29/01/2026',
  horarioSaida: '07:30',
  horarioChegada: '09:30',
  duracaoFormatada: '2h 00min',
  empresa: 'ITAITUBA(PA)-PARAUAPEBAS(PA)',
  classe: 'CONVENCIONAL',
  assentos: ['39'],
  localizadores: ['MHGMHYJ'],
  servico: '5010',
  poltrona: '39',
  total: 28.04,
  passageiro: {
    nome: 'Jucelino Alves',
    documento: '79469426215',
    email: 'jucelino@goodtrip-itb.com'
  },
  chaveBpe: '15260192954106004725630010042900991671955621',
  qrCode: '1526019295410600472563001004290099167195562100429009900120601202601290730000100000018000000093991869422001904090050',
  qrCodeBpe: 'https://dfe-portal.svrs.rs.gov.br/bpe/qrCode?chBPe=15260192954106004725630010042900991671955621&tpAmb=1',
  qrCodeTaxaEmbarque: '2901202600050100010102002175703915260192954106004725630010042900991671955621',
  tarifa: 18,
  pedagio: 0,
  taxaEmbarque: 5,
  seguro: 3.7,
  outros: 0,
  numeroBPe: '4290099',
  serie: '001',
  protocolo: '315260000200379',
  dataEmissao: '2026-01-13T06:57:12-03:00',
  prefixo: '120601',
  plataforma: '',
  linha: 'ITAITUBA(PA)-PARAUAPEBAS(PA)',
  cabecalhoEmitente: {
    razaoSocial: 'VIACAO OURO E PRATA S.A.',
    cnpj: '92954106004725',
    inscricaoEstadual: '154581976',
    endereco: 'TV DUQUE DE CAXIAS',
    numero: '200',
    bairro: 'AMPARO',
    cidade: 'SANTAREM',
    uf: 'PA',
    cep: '68035620'
  },
  dataHoraEmbarqueInicio: '29/01/2026 07:15',
  dataHoraEmbarqueFim: '29/01/2026 07:29',
  orgaoConcedenteId: 3, // ANTT (mock)
  _teste: true
};

function VisualizadorContent() {
  const sp = useSearchParams();
  const orderId = sp.get('order_id');
  
  const [loading, setLoading] = useState(false);
  const [reserva, setReserva] = useState<ReservaResult>(DADOS_MOCK);

  useEffect(() => {
    if (orderId) {
      buscarBilhete(orderId);
    }
  }, [orderId]);

  async function buscarBilhete(orderId: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/buscar-bilhete?orderId=${orderId}`);
      
      if (res.ok) {
        const data = await res.json();
        setReserva(data);
      }
    } catch (error) {
      console.error('Erro ao buscar bilhete:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </main>
    );
  }

  const chaveBpeFormatada = reserva?.chaveBpe ? 
    reserva.chaveBpe.match(/.{1,4}/g)?.join(' ') || reserva.chaveBpe : '';

  const numAssentos = reserva?.assentos?.length || 1;
  const assentos = reserva?.assentos || [reserva?.poltrona || ''];
  const localizadores = reserva?.localizadores || [reserva?.localizador || ''];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @media print {
          body * { visibility: hidden; }
          .bilhete-print, .bilhete-print * { visibility: visible; }
          .bilhete-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            page-break-after: always;
          }
          .no-print { display: none !important; }
          @page { 
            size: A4 landscape;
            margin: 0;
          }
        }
        
        .bilhete-print {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>

      <main className="min-h-screen bg-gray-100 py-4 px-4">
        <div className="max-w-[1200px] mx-auto mb-4 no-print flex gap-3">
          <Link href="/" className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-300">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          {reserva._teste && (
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-semibold border border-yellow-400">
              ⚠️ MODO VISUALIZAÇÃO
            </div>
          )}

          <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors ml-auto">
            <Download className="w-4 h-4" />
            Imprimir
          </button>
        </div>

        {assentos.map((assento, index) => {
          const localizadorAtual = localizadores[index] || reserva?.localizador || '';

          return (
            <div key={index} className="bilhete-print">
              <div className="max-w-[1200px] mx-auto bg-white" style={{ padding: '5mm' }}>
                
                {/* Container 3 colunas */}
                <div className="flex flex-row h-full" style={{ gap: 0 }}>
                  
                  {/* ========== COLUNA 1 (33%) ========== */}
                  <div className="flex flex-col" style={{ width: '33%', padding: '10px 12px', borderRight: '1px dashed #ccc', gap: '2rem' }}>
                    
                    {/* Header Empresa */}
                    <div>
                      <div className="text-center mb-2">
                        <h2 className="font-bold" style={{ fontSize: '12px', margin: 0 }}>
                          {reserva?.cabecalhoEmitente?.razaoSocial}
                        </h2>
                        <p style={{ fontSize: '9px', margin: '1px 0' }}>
                          CNPJ: {reserva?.cabecalhoEmitente?.cnpj} IE: {reserva?.cabecalhoEmitente?.inscricaoEstadual}
                        </p>
                        <p style={{ fontSize: '9px', margin: '1px 0' }}>
                          {reserva?.cabecalhoEmitente?.endereco}, {reserva?.cabecalhoEmitente?.numero}, {reserva?.cabecalhoEmitente?.bairro}, CEP {reserva?.cabecalhoEmitente?.cep}
                        </p>
                        <p style={{ fontSize: '9px', fontWeight: 600, margin: '1px 0' }}>
                          Documento Auxiliar do Bilhete de Passagem Eletrônico
                        </p>
                      </div>

                      {/* Info Viagem */}
                      <div>
                        <div className="flex flex-col">
                          <div>
                            <span className="font-bold" style={{ fontSize: '9px', color: '#333' }}>
                              Origem: {reserva?.origemNome}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold" style={{ fontSize: '9px', color: '#333' }}>
                              Destino: {reserva?.destinoNome}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-end" style={{ marginBottom: '3px' }}>
                          <div>
                            <span className="font-bold" style={{ fontSize: '9px' }}>Data:</span> {reserva?.dataFormatada}
                          </div>
                          <div className="text-right">
                            <span className="font-bold" style={{ fontSize: '9px' }}>Hora:</span> {reserva?.horarioSaida}
                          </div>
                        </div>

                        <div className="flex justify-between items-end" style={{ marginBottom: '3px' }}>
                          <div>
                            <span className="font-bold" style={{ fontSize: '9px' }}>Poltrona: {assento}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold" style={{ fontSize: '9px' }}>Plataforma: {reserva?.plataforma || '-'}</span>
                          </div>
                        </div>

                        <div style={{ margin: '5px 0' }}>
                          <span className="font-bold" style={{ fontSize: '9px' }}>Linha: {reserva?.linha}</span>
                          <div className="flex justify-between items-end">
                            <span style={{ fontSize: '10px' }}>Modalidade: {reserva?.classe}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-end" style={{ marginBottom: '3px', fontSize: '10px' }}>
                          <span>Prefixo: {reserva?.prefixo}</span>
                          <span>Serviço: {reserva?.servico}</span>
                        </div>

                        {/* Tabela Financeira */}
                        <table style={{ width: '100%', margin: '8px 0', borderCollapse: 'collapse', fontSize: '9px' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '1px 0' }}>Tarifa:</td>
                              <td className="text-right" style={{ padding: '1px 0' }}>R$ {(reserva?.tarifa || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '1px 0' }}>Pedágio:</td>
                              <td className="text-right">R$ {(reserva?.pedagio || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '1px 0' }}>Taxa de Embarque:</td>
                              <td className="text-right">R$ {(reserva?.taxaEmbarque || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '1px 0' }}>Seguro:</td>
                              <td className="text-right">R$ {(reserva?.seguro || 0).toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px dashed #ccc' }}>
                              <td style={{ padding: '1px 0' }}>Outros:</td>
                              <td className="text-right">R$ {(reserva?.outros || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style={{ paddingTop: '5px', fontWeight: 700 }}>Valor total:</td>
                              <td className="text-right font-bold" style={{ paddingTop: '5px' }}>R$ {((reserva?.total || 0) / numAssentos).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td>Desconto:</td>
                              <td className="text-right">R$ 0,00</td>
                            </tr>
                            <tr className="font-bold">
                              <td>Valor a Pagar:</td>
                              <td className="text-right">R$ {((reserva?.total || 0) / numAssentos).toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>

                        <div className="flex justify-between items-end" style={{ marginBottom: '3px', fontSize: '10px' }}>
                          <span>Forma de pagamento</span>
                          <span>Valor Pago</span>
                        </div>
                        <div className="flex justify-between items-end" style={{ marginBottom: '3px', fontSize: '10px' }}>
                          <span>Vale Eletrônico WEBTEF</span>
                          <span>R$ {((reserva?.total || 0) / numAssentos).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end" style={{ fontSize: '10px' }}>
                          <span>Troco:</span>
                          <span>R$ 0,00</span>
                        </div>
                      </div>
                    </div>

                    {/* Chave de Acesso */}
                    <div>
                      <div className="text-center">
                        <p style={{ fontSize: '8px', marginBottom: '2px' }}>
                          Consulte a chave de acesso em: <br />
                          <a href="https://dfe-portal.svrs.rs.gov.br/bpe/qrcode" style={{ color: '#000', textDecoration: 'none' }}>
                            dfe-portal.svrs.rs.gov.br/bpe/qrcode
                          </a>
                        </p>
                        <strong style={{ fontSize: '8px', display: 'block', marginBottom: '5px' }}>
                          {chaveBpeFormatada}
                        </strong>

                        {/* Barcode */}
                        <div style={{ textAlign: 'center', overflow: 'hidden', marginTop: '1rem', marginBottom: '1rem' }}>
                          <svg width="100%" height="40" style={{ maxWidth: '100%' }}>
                            <rect width="100%" height="100%" fill="white"/>
                            {[...Array(50)].map((_, i) => (
                              <rect 
                                key={i} 
                                x={i * 4} 
                                y="5" 
                                width={Math.random() > 0.5 ? 1 : 2} 
                                height="30" 
                                fill="black"
                              />
                            ))}
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-start" style={{ gap: '0.5rem' }}>
                        <div className="flex items-center" style={{ gap: '5px', marginTop: '5px' }}>
                          {reserva?.qrCodeBpe && (
                            <QRCodeSVG value={reserva.qrCodeBpe} size={90} level="M" />
                          )}
                        </div>
                        <div style={{ fontSize: '8px', lineHeight: 1.1 }}>
                          <p>Passageiro: {reserva?.passageiro?.nome}</p>
                          <p>Doc: {reserva?.passageiro?.documento}</p>
                          <p>Tipo de Desconto: Tarifa promocional</p>
                          <p>Bp-e nº: {reserva?.numeroBPe} Série: {reserva?.serie} | Tipo BP-e: 0</p>
                          <p>Protocolo de Autorização: {reserva?.protocolo}</p>
                          <p>Data de Autorização: {reserva?.dataEmissao ? new Date(reserva.dataEmissao).toLocaleString('pt-BR') : ''}</p>
                          <p>Nº Bilhete: {reserva?.numeroBilhete}</p>
                          <p>Localizador: {localizadorAtual}</p>
                        </div>
                      </div>

                      <p style={{ fontSize: '8px', marginTop: '10px' }}>
                        ICMS-RS 5,10 (17,00%) OUTROS TRIB-RS 4,80 (16,00%) Horário de Início do embarque: {reserva?.dataHoraEmbarqueInicio} Horário final do embarque: {reserva?.dataHoraEmbarqueFim} Classe de Serviço: (IC) {reserva?.classe}
                      </p>
                    </div>
                  </div>

                  {/* ========== COLUNA 2 (34%) ========== */}
                  <div className="flex flex-col" style={{ width: '34%', padding: '10px 12px', borderRight: '1px dashed #ccc' }}>
                    
                    {/* 🔥 NOVO: Usar HTML da API se disponível */}
                    {reserva?.customizacaoRodapeCupomDeEmbarque ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: reserva.customizacaoRodapeCupomDeEmbarque }}
                        style={{ fontSize: '11px', textAlign: 'justify', lineHeight: 1.2, height: '555px' }}
                      />
                    ) : (
                      <div style={{ fontSize: '11px', textAlign: 'justify', lineHeight: 1.2, height: '555px' }}>
                        <p style={{ marginBottom: '6px' }}>
                          Os direitos e deveres dos passageiros podem ser consultados através do Guia de Orientação aos Passageiros, disponíveis no formato digital nos guichês, ônibus e site da empresa.
                        </p>

                        <p className="font-bold" style={{ marginTop: '8px', textTransform: 'uppercase' }}>
                          REGRAS PARA TRANSFERÊNCIA E REMARCAÇÃO:
                        </p>

                        <p style={{ marginBottom: '6px' }}>
                          <strong>Cancelamento e Reembolso:</strong> O passageiro pode solicitar cancelamento e reembolso até 3 horas antes da viagem. <strong>Não Comparecimento:</strong> Se o passageiro não comparecer e não cancelar até 3 horas antes da viagem, perderá o direito ao reembolso.
                        </p>

                        <p style={{ marginBottom: '6px' }}>
                          <strong>Devolução do Valor:</strong> A empresa devolve o valor pago em até 30 dias após o pedido, com retenção de 5% como multa.
                        </p>

                        <p style={{ marginBottom: '6px' }}>
                          <strong>Reembolso Integral:</strong> Passageiros que comprarem bilhetes online têm direito a reembolso integral se solicitarem cancelamento em até 7 dias após a compra, desde que a viagem não comece em menos de 3 horas.
                        </p>

                        <p style={{ marginBottom: '6px' }}>
                          <strong>Taxa de Remarcação:</strong> Se a remarcação for feita após 3 horas antes da viagem, será cobrada uma taxa de 20% do valor pago.
                        </p>

                        <p style={{ marginBottom: '6px' }}>
                          <strong>Diferença de Valor:</strong> Em caso de remarcação, o passageiro paga ou recebe a diferença entre o valor pago e o novo valor.
                        </p>

                        <p style={{ marginBottom: '6px' }}>
                          <strong>Remarcação Após 3 Horas:</strong> Após 3 horas antes da viagem, a passagem só pode ser remarcada para a mesma origem e destino.
                        </p>

                        <p style={{ marginBottom: '6px' }}>
                          <strong>Troca de Trecho:</strong> A troca de trecho requer antecedência mínima de 3 horas antes da viagem, e nenhuma remarcação fora do prazo de 3 horas.
                        </p>

                        <p style={{ marginBottom: '6px' }}>
                          <strong>Transferibilidade:</strong> Bilhetes são nominais e podem ser transferíveis, salvo disposição contrária.
                        </p>

                        <p style={{ marginBottom: '6px' }}>
                          <strong>Gratuidades e Descontos:</strong> Bilhetes emitidos com gratuidades e descontos legais são intransferíveis.
                        </p>
                      </div>
                    )}

                    {/* 🔥 QR Code do Guia - SÓ MOSTRA SE FOR ANTT (ID 3) */}
                    {reserva?.orgaoConcedenteId === 3 && (
                      <div className="flex flex-col items-center mt-auto pt-2" style={{ gap: '0.2rem' }}>
                        <p className="text-center font-semibold" style={{ fontSize: '12px' }}>
                          Para ler o guia do passageiro<br />completo acesse pelo QRCode abaixo
                        </p>
                        <QRCodeSVG value="https://www.viacaoouroepratacom.br/guia-passageiros" size={90} level="M" />
                        <a href="https://www.viacaoouroepratacom.br/guia-passageiros" style={{ fontSize: '8px', marginTop: '10px', color: '#000', textDecoration: 'none' }}>
                          www.viacaoouroepratacom.br/guia-passageiros
                        </a>
                      </div>
                    )}
                  </div>

                  {/* ========== COLUNA 3 (33%) ========== */}
                  <div className="flex flex-col justify-between" style={{ width: '33%', padding: '10px 12px' }}>
                    
                    <div>
                      <div className="text-right w-full">
                        <h3 className="text-center font-bold" style={{ fontSize: '12px', margin: 0 }}>Passagem Digital</h3>
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                          <svg width="100%" height="40" style={{ maxWidth: '100%' }}>
                            <rect width="100%" height="100%" fill="white"/>
                            {[...Array(50)].map((_, i) => (
                              <rect 
                                key={i} 
                                x={i * 4} 
                                y="5" 
                                width={Math.random() > 0.5 ? 1 : 2} 
                                height="30" 
                                fill="black"
                              />
                            ))}
                          </svg>
                        </div>
                      </div>

                      <div className="w-full text-center" style={{ borderBottom: '1px dashed #999', margin: '6px 0', fontSize: '8px', color: '#666', lineHeight: 0.1 }}>
                        <span style={{ background: '#fff', padding: '0 5px' }}>Use esse documento para embarcar direto</span>
                      </div>

                      <div className="w-full flex flex-col flex-grow" style={{ gap: '4px' }}>
                        <div style={{ marginBottom: '2px' }}>
                          <span className="font-bold" style={{ fontSize: '8px' }}>Origem</span>
                          <div className="font-bold" style={{ fontSize: '10px' }}>{reserva?.origemNome}</div>
                          <div style={{ fontSize: '8px' }}>Local de Embarque: {reserva?.origemNome}</div>
                        </div>

                        <div style={{ marginBottom: '2px' }}>
                          <span className="font-bold" style={{ fontSize: '8px' }}>Destino</span>
                          <div className="font-bold" style={{ fontSize: '10px' }}>{reserva?.destinoNome}</div>
                          <div style={{ fontSize: '8px' }}>Local de Desembarque: {reserva?.destinoNome}</div>
                        </div>

                        <div style={{ marginBottom: '2px', marginTop: '5px' }}>
                          <span className="font-bold" style={{ fontSize: '8px' }}>Linha</span>
                          <div className="font-bold" style={{ fontSize: '8px' }}>{reserva?.linha}</div>
                        </div>

                        <div className="flex justify-between items-end" style={{ marginTop: '5px' }}>
                          <div>
                            <span className="font-bold" style={{ fontSize: '8px' }}>Data da viagem</span>
                            <div className="font-bold" style={{ fontSize: '10px' }}>{reserva?.dataFormatada}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold" style={{ fontSize: '8px' }}>Hora da viagem</span>
                            <div className="font-bold" style={{ fontSize: '10px' }}>{reserva?.horarioSaida}</div>
                          </div>
                        </div>

                        <div className="text-center font-bold" style={{ margin: '5px 0', fontSize: '10px' }}>
                          Horário Inicio Embarque: {reserva?.dataHoraEmbarqueInicio?.split(' ')[1]} / Horário Fim Embarque: {reserva?.dataHoraEmbarqueFim?.split(' ')[1]}
                        </div>

                        <div className="flex justify-between items-start" style={{ margin: '8px 0' }}>
                          <div style={{ width: '50%' }}>
                            <span className="font-bold" style={{ fontSize: '8px' }}>Poltrona</span>
                            <div style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1 }}>{assento}</div>
                          </div>
                          <div style={{ width: '50%', textAlign: 'right' }}>
                            <span className="font-bold" style={{ fontSize: '8px' }}>Plataforma</span>
                            <div style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1 }}>{reserva?.plataforma || '-'}</div>
                          </div>
                        </div>

                        <div style={{ marginBottom: '2px' }}>
                          <span className="font-bold" style={{ fontSize: '8px' }}>Nome</span>
                          <div className="font-bold" style={{ fontSize: '8px' }}>{reserva?.passageiro?.nome?.toUpperCase()}</div>
                          <span className="font-bold" style={{ fontSize: '8px' }}>Documento</span>
                          <div className="font-bold" style={{ fontSize: '8px' }}>{reserva?.passageiro?.documento}</div>
                        </div>

                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold" style={{ fontSize: '8px' }}>Tipo</span>
                            <div className="font-bold" style={{ fontSize: '8px' }}>{reserva?.classe}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold" style={{ fontSize: '8px' }}>Nº Bilhete/BP-e</span>
                            <div className="font-bold" style={{ fontSize: '8px' }}>{reserva?.numeroBilhete}</div>
                            <div className="font-bold" style={{ fontSize: '8px' }}>{reserva?.numeroBPe}</div>
                          </div>
                        </div>

                        <div style={{ marginBottom: '2px' }}>
                          <span className="font-bold" style={{ fontSize: '8px' }}>Viação</span>
                          <div className="font-bold" style={{ fontSize: '8px' }}>{reserva?.cabecalhoEmitente?.razaoSocial}</div>
                        </div>
                      </div>
                    </div>

                    {reserva?.qrCodeTaxaEmbarque && (
                      <div className="text-center flex flex-col justify-center items-center" style={{ marginTop: '10px', gap: '0.5rem' }}>
                        <span className="font-bold" style={{ fontSize: '9px' }}>Rodoviária</span>
                        <QRCodeSVG value={reserva.qrCodeTaxaEmbarque} size={90} level="M" style={{ marginTop: '2px' }} />
                      </div>
                    )}

                    <div className="text-center" style={{ marginTop: '5px', fontSize: '9px' }}>
                      <p>Para embarcar na rodoviária</p>
                      <div style={{ lineHeight: 1 }}>
                        <p style={{ fontSize: '9px' }}>Localizador</p>
                        <p style={{ fontWeight: 800, fontSize: '14px' }}>{localizadorAtual}</p>
                      </div>
                      <a href="https://www.viacaoouroeprata.com.br/site/" style={{ color: 'gray', fontSize: '8px', textDecoration: 'none' }}>
                        www.viacaoouroeprata.com.br/site
                      </a>
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

export default function VisualizarBilhetePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VisualizadorContent />
    </Suspense>
  );
}