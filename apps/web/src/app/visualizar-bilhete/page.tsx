'use client';

import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';

// 🔥 DADOS DA SUA COMPRA REAL (do log que você me mandou)
const reservaMock = {
  localizador: 'JLKBBLK',
  status: 'CONFIRMADO' as const,
  total: 26.70,
  numeroBilhete: '10000033001772',
  numeroSistema: '476045',
  origemNome: 'ITAITUBA - PA',
  destinoNome: 'KM 30 (CAMPO VERDE) - PA',
  data: '2025-12-21',
  dataFormatada: '21/12/2025',
  horarioSaida: '07:30',
  horarioChegada: '—',
  empresa: 'VIACAO OURO E PRATA S.A.',
  classe: 'CONVENCIONAL',
  assentos: ['3'],
  servico: '5010',
  passageiro: {
    nome: 'Eduardo Bernardes',
    email: 'eduardo@email.com',
    documento: '10390289930',
  },
  chaveBpe: '15251292954106004725630010042185191567425296',
  qrCode: '1525129295410600472563001004218519156742529600421851900120601202512210730000100000018000000041999999999001904090050', // EMBARQUE
  qrCodeBpe: 'https://dfe-portal.svrs.rs.gov.br/bpe/qrCode?chBPe=15251292954106004725630010042185191567425296&tpAmb=1', // FISCAL
  tarifa: 18.00,
  pedagio: 0,
  taxaEmbarque: 5.00,
  seguro: 3.70,
  outros: 0,
  numeroBPe: '4218519',
  serie: '001',
  protocolo: '315250004940126',
  dataEmissao: '16/12/2025, 22:09:00',
  _teste: false,
};

export default function VisualizarBilhetePage() {
  const reserva = reservaMock;
  const chaveBpeFormatada = reserva.chaveBpe.match(/.{1,4}/g)?.join(' ') || reserva.chaveBpe;

  return (
    <>
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          #bilhete-eletronico {
            box-shadow: none !important;
            border: 1px solid #000 !important;
          }
          @page { margin: 0.5cm; size: A4 portrait; }
        }
      `}</style>

      <main className="min-h-screen bg-gray-100 py-8 px-4">
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
              <div><p className="text-sm font-bold text-gray-900">Origem: {reserva.origemNome}</p></div>
              <div><p className="text-sm font-bold text-gray-900">Destino: {reserva.destinoNome}</p></div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Data:</p>
                <p className="font-bold text-gray-900">{reserva.dataFormatada}</p>
              </div>
              <div>
                <p className="text-gray-600">Embarque:</p>
                <p className="font-bold text-gray-900">{reserva.dataFormatada} {reserva.horarioSaida}</p>
              </div>
              <div>
                <p className="text-gray-600">Poltrona:</p>
                <p className="font-bold text-gray-900 text-xl">{reserva.assentos[0]}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mt-3">
              <div>
                <p className="text-gray-600">Serviço:</p>
                <p className="font-bold text-gray-900">{reserva.servico}</p>
              </div>
              <div>
                <p className="text-gray-600">Tipo:</p>
                <p className="font-bold text-gray-900">{reserva.classe}</p>
              </div>
              <div>
                <p className="text-gray-600">Tipo Viagem:</p>
                <p className="font-bold text-gray-900">HORARIO ORDINARIO</p>
              </div>
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
                <div className="flex justify-between">
                  <span className="text-gray-700">Tarifa:</span>
                  <span className="font-semibold">R$ {reserva.tarifa.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Pedágio:</span>
                  <span className="font-semibold">R$ {reserva.pedagio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Taxa de Embarque:</span>
                  <span className="font-semibold">R$ {reserva.taxaEmbarque.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Seguro:</span>
                  <span className="font-semibold">R$ {reserva.seguro.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-gray-900">Valor Total:</span>
                  <span>R$ {reserva.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CHAVE BPe */}
          <div className="border-b-2 border-gray-300 p-6 text-center">
            <p className="text-xs text-gray-600 mb-2">Consulta pela Chave de Acesso em</p>
            <p className="text-xs text-blue-600 mb-3">http://bpe.svrs.rs.gov.br/consulta</p>
            <div className="font-mono text-lg font-bold tracking-wider text-gray-900 mb-3">
              {chaveBpeFormatada}
            </div>
            <div className="h-20 bg-gray-100 flex items-center justify-center border border-gray-300">
              <p className="text-xs text-gray-500">Código de Barras: {reserva.chaveBpe.substring(0, 20)}...</p>
            </div>
          </div>

          {/* DADOS PASSAGEIRO E QR CODE */}
          <div className="border-b-2 border-gray-300 p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-center">
                <QRCodeSVG value={reserva.qrCodeBpe} size={192} level="M" />
              </div>

              <div className="text-sm space-y-2">
                <div>
                  <p className="text-gray-600">Passageiro(a)</p>
                  <p className="font-bold text-gray-900">
                    DOC {reserva.passageiro.documento} - {reserva.passageiro.nome.toUpperCase()}
                  </p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-gray-600">BP-e nº: {reserva.numeroBPe} Série: {reserva.serie}</p>
                  <p className="text-gray-600">Data de emissão: {reserva.dataEmissao}</p>
                  <p className="text-gray-600">Protocolo: {reserva.protocolo}</p>
                  <p className="text-gray-600">Nº bilhete: {reserva.numeroBilhete}</p>
                  <p className="text-gray-600">Localizador: {reserva.localizador}</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR CODE PORTÃO */}
          <div className="border-b-2 border-gray-300 p-6 text-center">
            <QRCodeSVG value={reserva.qrCode} size={192} level="M" className="mx-auto mb-2" />
            <p className="font-bold text-gray-900">Acesso ao Portão de Embarque</p>
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