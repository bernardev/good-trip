'use client';

import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';

export default function VisualizarBilhete() {
  // 🔥 DADOS REAIS DA COMPRA MLKDDJE
  const reserva = {
    localizador: "MLKDDJE",
    status: "CONFIRMADO",
    numeroBilhete: "10000033010083",
    numeroSistema: "477348",
    poltrona: "44",
    servico: "1110",
    total: 39.50,
    origemNome: "ITAITUBA - PA",
    destinoNome: "KM 30 (CAMPO VERDE) - PA",
    data: "2025-12-24",
    dataFormatada: "24/12/2025",
    horarioSaida: "14:40",
    horarioChegada: "15:30",
    duracaoFormatada: "50min",
    empresa: "VIACAO OURO E PRATA S.A.",
    classe: "SEMILEITO",
    assentos: ["44"],
    passageiro: {
      nome: "Jucelino Alves",
      documento: "79469426215",
      email: "Jucelino@goodtrip-itb.com",
    },
    // 🔥 3 QR CODES
    chaveBpe: "15251292954106004725630010042197991770295691",
    qrCode: "15251292954106004725630010042197991770295691004219799RSPA0088202512271440000100000033000000041999999999001904090050", // Monitriip - Embarque ônibus
    qrCodeBpe: "https://dfe-portal.svrs.rs.gov.br/bpe/qrCode?chBPe=15251292954106004725630010042197991770295691&tpAmb=1", // Fiscal
    qrCodeTaxaEmbarque: "2412202500011100010102002175704415251292954106004725630010042197991770295691", // Taxa embarque rodoviária
    tarifa: 33.00,
    pedagio: 0,
    taxaEmbarque: 5,
    seguro: 1.5,
    outros: 0,
    numeroBPe: "4219799",
    serie: "001",
    protocolo: "315250004948079",
    dataEmissao: "2025-12-17T12:30:29-03:00",
    _teste: false,
  };

  const chaveBpeFormatada = reserva.chaveBpe.match(/.{1,4}/g)?.join(' ') || '';

  return (
    <>
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          #bilhete-eletronico {
            box-shadow: none !important;
            border: 1px solid #000 !important;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          @page { margin: 0.5cm; size: A4 portrait; }
          #bilhete-eletronico { font-size: 11px !important; transform: scale(0.95); }
          #bilhete-eletronico h1 { font-size: 16px !important; }
          #bilhete-eletronico h2 { font-size: 14px !important; }
          #bilhete-eletronico .text-sm { font-size: 10px !important; }
          #bilhete-eletronico .text-xs { font-size: 9px !important; }
          #bilhete-eletronico .p-6 { padding: 10px !important; }
          #bilhete-eletronico img { max-width: 100px !important; }
        }
      `}</style>

      <main className="min-h-screen bg-gray-100 py-8 px-4">
        {/* Botões superiores */}
        <div className="max-w-4xl mx-auto mb-4 no-print flex gap-3">
          <Link href="/" className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-300">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors ml-auto">
            <Download className="w-4 h-4" />
            Imprimir Bilhete
          </button>
        </div>

        {/* Bilhete Eletrônico */}
        <div id="bilhete-eletronico" className="max-w-4xl mx-auto bg-white shadow-xl border border-gray-300">
          
          {/* CABEÇALHO */}
          <div className="border-b-2 border-gray-300 p-6">
            <div className="flex items-start gap-6 mb-4">
              <div className="flex-shrink-0">
                <Image src="/logo-goodtrip.jpeg" alt="Good Trip" width={120} height={120} className="object-contain" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">GOOD TRIP PASSAGENS LTDA</h1>
                <p className="text-sm text-gray-700">CNPJ: 57.355.709/0001-27</p>
                <p className="text-sm text-gray-700">Rodovia Transamazônica, SN, Box 09, Bairro Bela Vista</p>
                <p className="text-sm text-gray-700">Itaituba – PA, CEP 68180-010</p>
              </div>
              
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
              <div><p className="text-sm font-bold text-gray-900 mb-1">Origem: {reserva.origemNome}</p></div>
              <div><p className="text-sm font-bold text-gray-900 mb-1">Destino: {reserva.destinoNome}</p></div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-gray-600">Data:</p><p className="font-bold text-gray-900">{reserva.dataFormatada}</p></div>
              <div><p className="text-gray-600">Embarque:</p><p className="font-bold text-gray-900">{reserva.dataFormatada} {reserva.horarioSaida}</p></div>
              <div><p className="text-gray-600">Poltrona:</p><p className="font-bold text-gray-900 text-xl">{reserva.poltrona}</p></div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mt-3">
              <div><p className="text-gray-600">Serviço:</p><p className="font-bold text-gray-900">{reserva.servico}</p></div>
              <div><p className="text-gray-600">Tipo:</p><p className="font-bold text-gray-900">{reserva.classe}</p></div>
              <div><p className="text-gray-600">Tipo Viagem:</p><p className="font-bold text-gray-900">HORARIO ORDINARIO</p></div>
            </div>

            <div className="mt-3 text-sm">
              <p className="text-gray-600">Linha:</p>
              <p className="font-bold text-gray-900">{reserva.empresa}</p>
            </div>
          </div>

          {/* VALORES */}
          <div className="border-b-2 border-gray-300 p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-700">Tarifa:</span><span className="font-semibold">R$ {reserva.tarifa.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-700">Pedágio:</span><span className="font-semibold">R$ {reserva.pedagio.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-700">Taxa de Embarque:</span><span className="font-semibold">R$ {reserva.taxaEmbarque.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-700">Outros:</span><span className="font-semibold">R$ {reserva.outros.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-700">Seguro:</span><span className="font-semibold">R$ {reserva.seguro.toFixed(2)}</span></div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-700">Imposto:</span><span className="font-semibold">R$ 0,00</span></div>
                <div className="flex justify-between font-bold text-base pt-2 border-t"><span className="text-gray-900">Valor Total:</span><span>R$ {reserva.total.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-700">Desconto:</span><span className="font-semibold">R$ 0,00</span></div>
                <div className="flex justify-between font-bold text-lg"><span className="text-gray-900">Valor a Pagar:</span><span>R$ {reserva.total.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t text-sm">
              <div className="flex justify-between mb-1"><span className="font-bold text-gray-900">FORMA PAGAMENTO:</span><span className="font-bold">VALOR PAGO</span></div>
              <div className="flex justify-between"><span className="text-gray-700">Crédito:</span><span className="font-semibold">R$ {reserva.total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-700">Troco:</span><span className="font-semibold">R$ 0,00</span></div>
            </div>
          </div>

          {/* CHAVE BPe E CÓDIGO DE BARRAS */}
          <div className="border-b-2 border-gray-300 p-6 text-center">
            <p className="text-xs text-gray-600 mb-2">Consulta pela Chave de Acesso em</p>
            <p className="text-xs text-blue-600 mb-3">http://bpe.svrs.rs.gov.br/consulta</p>
            <div className="font-mono text-lg font-bold tracking-wider text-gray-900 mb-3">{chaveBpeFormatada}</div>
            <div className="h-20 bg-gray-100 flex items-center justify-center border border-gray-300">
              <p className="text-xs text-gray-500">Código de Barras: {reserva.chaveBpe.substring(0, 20)}...</p>
            </div>
          </div>

          {/* DADOS PASSAGEIRO E QR CODE BPe FISCAL */}
          <div className="border-b-2 border-gray-300 p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-center">
                <img src={reserva.qrCodeBpe} alt="QR Code BPe" className="w-48 h-48" />
              </div>

              <div className="text-sm space-y-2">
                <div>
                  <p className="text-gray-600">Passageiro(a)</p>
                  <p className="font-bold text-gray-900">DOC {reserva.passageiro.documento} - {reserva.passageiro.nome.toUpperCase()}</p>
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
                  <p className="text-gray-600">BP-e nº: {reserva.numeroBPe} Série: {reserva.serie}</p>
                  <p className="text-gray-600">Data de emissão: {new Date(reserva.dataEmissao).toLocaleString('pt-BR')}</p>
                  <p className="text-gray-600">Protocolo de autorização: {reserva.protocolo}</p>
                  <p className="text-gray-600">Nº bilhete: {reserva.numeroBilhete}</p>
                  <p className="text-gray-600">Localizador: {reserva.localizador}</p>
                </div>
              </div>
            </div>
          </div>

          {/* TRIBUTOS */}
          <div className="border-b-2 border-gray-300 p-4 text-xs text-gray-700">
            <p>Tributos Totais Incidentes (Lei Federal nº 12.741/2012) - ICMS: R$ {(reserva.total * 0.17).toFixed(2)} (17,00%) OUTROS TRIB: R$ {(reserva.total * 0.02).toFixed(2)} (2,00%)</p>
            <p className="mt-1">Horário de início do embarque {reserva.dataFormatada} {reserva.horarioSaida}. Horário final do embarque: {reserva.dataFormatada} 14:39</p>
          </div>

          {/* 🔥 QR CODE 1: EMBARQUE NO ÔNIBUS (Monitriip) */}
          <div className="border-b-2 border-gray-300 p-6 text-center bg-blue-50">
            <QRCodeSVG value={reserva.qrCode} size={192} level="M" className="mx-auto mb-2" />
            <p className="font-bold text-gray-900 text-lg">📱 QR Code 1: Embarque no Ônibus</p>
            <p className="text-xs text-gray-600 mt-1">Apresente este QR Code ao motorista (Monitriip)</p>
            <p className="text-xs text-gray-400 mt-2 font-mono break-all">{reserva.qrCode.substring(0, 50)}...</p>
          </div>

          {/* 🔥 QR CODE 2: TAXA EMBARQUE RODOVIÁRIA */}
          <div className="border-b-2 border-gray-300 p-6 text-center bg-yellow-50">
            <QRCodeSVG value={reserva.qrCodeTaxaEmbarque} size={192} level="M" className="mx-auto mb-2" />
            <p className="font-bold text-gray-900 text-lg">🚪 QR Code 2: Acesso à Área de Embarque</p>
            <p className="text-xs text-gray-600 mt-1">Apresente este QR Code na catraca da rodoviária</p>
            <p className="text-xs text-gray-400 mt-2 font-mono break-all">{reserva.qrCodeTaxaEmbarque}</p>
          </div>

          {/* 🔥 QR CODE 3: FISCAL (já mostrado acima com dados do passageiro) */}
          <div className="border-b-2 border-gray-300 p-6 text-center bg-green-50">
            <img src={reserva.qrCodeBpe} alt="QR Code Fiscal" className="w-48 h-48 mx-auto mb-2" />
            <p className="font-bold text-gray-900 text-lg">📄 QR Code 3: Consulta Fiscal (BPe)</p>
            <p className="text-xs text-gray-600 mt-1">Para consultar na Receita Federal</p>
            <p className="text-xs text-blue-600 mt-2 break-all">{reserva.qrCodeBpe}</p>
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