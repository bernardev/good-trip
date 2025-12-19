'use client';

import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';

export default function VisualizarBilhete() {
  const reserva = {
    localizador: "MLKDDJE",
    numeroBilhete: "10000033010083",
    poltrona: "44",
    servico: "1110",
    total: 39.50,
    origemNome: "ITAITUBA - PA",
    destinoNome: "KM 30 (CAMPO VERDE) - PA",
    dataFormatada: "27/12/2025",
    horarioSaida: "14:40",
    horarioChegada: "15:30",
    classe: "SEMILEITO",
    prefixo: "RSPA0088022",
    plataforma: "",
    linha: "PORTO ALEGRE(RS)-SANTAREM(PA)",
    passageiro: {
      nome: "Jucelino Alves",
      documento: "79469426215",
    },
    chaveBpe: "15251292954106004725630010042197991770295691",
    qrCode: "15251292954106004725630010042197991770295691004219799RSPA0088202512271440000100000033000000041999999999001904090050",
    qrCodeBpe: "https://dfe-portal.svrs.rs.gov.br/bpe/qrCode?chBPe=15251292954106004725630010042197991770295691&tpAmb=1",
    qrCodeTaxaEmbarque: "2412202500011100010102002175704415251292954106004725630010042197991770295691",
    tarifa: 33.00,
    pedagio: 0,
    taxaEmbarque: 5,
    seguro: 1.5,
    outros: 0,
    numeroBPe: "4219799",
    serie: "001",
    protocolo: "315250004948079",
    dataEmissao: "2025-12-17T12:30:29-03:00",
    cabecalhoAgencia: {
      razaoSocial: "GOOD TRIP TRANSPORTE E TURISMO LTDA",
      cnpj: "38.627.614/0001-70",
      endereco: "AG GETULIO VARGAS, 519 - CENTRO",
      cidade: "ITAITUBA - PA"
    },
    cabecalhoEmitente: {
      razaoSocial: "VIACAO OURO E PRATA S.A.",
      cnpj: "92954106004725",
      inscricaoEstadual: "154581976",
      endereco: "TV DUQUE DE CAXIAS, 200 - AMPARO",
      cidade: "SANTAREM",
      uf: "PA",
      cep: "68035620"
    }
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden; }
          #bilhete-eletronico, #bilhete-eletronico * { visibility: visible; }
          #bilhete-eletronico {
            position: fixed;
            left: 0;
            top: 0;
            width: 210mm;
            max-height: 297mm;
            overflow: hidden;
            padding: 3mm;
          }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      <main className="min-h-screen bg-gray-100 py-4 px-4">
        <div className="max-w-4xl mx-auto mb-4 no-print flex gap-3">
          <Link href="/" className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 border border-gray-300">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 ml-auto">
            <Download className="w-4 h-4" />
            Imprimir Bilhete
          </button>
        </div>

        <div id="bilhete-eletronico" className="max-w-4xl mx-auto bg-white shadow-xl border border-gray-300" style={{fontSize: '9px'}}>
          
          {/* CABEÇALHO AGÊNCIA */}
          <div className="border-b flex items-start gap-2 p-2">
            <Image src="/logo-goodtrip.jpeg" alt="Good Trip" width={50} height={50} className="object-contain" />
            <div className="flex-1">
              <p className="font-bold text-xs">{reserva.cabecalhoAgencia.razaoSocial}</p>
              <p className="text-xs">CNPJ: {reserva.cabecalhoAgencia.cnpj}</p>
              <p className="text-xs">{reserva.cabecalhoAgencia.endereco} | {reserva.cabecalhoAgencia.cidade}</p>
            </div>
            <p className="text-xs">SAC: (93) 99143-6570</p>
          </div>

          {/* CABEÇALHO EMITENTE */}
          <div className="border-b bg-gray-50 p-2 text-center">
            <p className="font-bold text-xs">{reserva.cabecalhoEmitente.razaoSocial}</p>
            <p className="text-xs">CNPJ: {reserva.cabecalhoEmitente.cnpj} IE: {reserva.cabecalhoEmitente.inscricaoEstadual}</p>
            <p className="text-xs">{reserva.cabecalhoEmitente.endereco} | CIDADE | ESTADO: {reserva.cabecalhoEmitente.cidade} | {reserva.cabecalhoEmitente.uf} CEP: {reserva.cabecalhoEmitente.cep}</p>
            <p className="font-bold text-sm mt-1">Documento Auxiliar do Bilhete de Passagem Eletrônico</p>
            <p className="text-xs">SAC: 0800 551 8666</p>
          </div>

          {/* ORIGEM E DESTINO */}
          <div className="border-b p-2">
            <div className="flex justify-between text-sm font-bold mb-2">
              <div>Origem: {reserva.origemNome}</div>
              <div>Destino: {reserva.destinoNome}</div>
            </div>
            <p className="text-center text-sm font-bold">Data: {reserva.dataFormatada}</p>
          </div>

          {/* DADOS DA VIAGEM - COM CHEGADA */}
          <div className="border-b p-2 text-center">
            <div className="grid grid-cols-4 gap-2 mb-2 text-xs">
              <div className="text-left">
                <p><strong>Embarque:</strong> {reserva.dataFormatada} {reserva.horarioSaida}</p>
              </div>
              <div>
                <p><strong>Partida:</strong> {reserva.dataFormatada} {reserva.horarioSaida}</p>
              </div>
              <div>
                <p><strong>Chegada:</strong> {reserva.dataFormatada} {reserva.horarioChegada}</p>
              </div>
              <div className="text-right">
                <p><strong>Poltrona:</strong> {reserva.poltrona}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div><p><strong>Serviço:</strong> {reserva.servico}</p></div>
              <div><p><strong>Tipo:</strong> {reserva.classe}</p></div>
              <div><p><strong>Prefixo:</strong> {reserva.prefixo}</p></div>
            </div>
            
            <div className="text-xs mt-1">
              <p><strong>Linha:</strong> {reserva.linha}</p>
              {reserva.plataforma && <p><strong>Plataforma:</strong> {reserva.plataforma}</p>}
            </div>
          </div>

          {/* VALORES - LAYOUT CENTRALIZADO */}
          <div className="border-b p-2 text-center text-xs">
            <div className="space-y-0.5">
              <p><strong>Tarifa:</strong> R$ {reserva.tarifa.toFixed(2)}</p>
              <p><strong>Pedágio:</strong> R$ {reserva.pedagio.toFixed(2)}</p>
              <p><strong>Embarque:</strong> R$ {reserva.taxaEmbarque.toFixed(2)}</p>
              <p><strong>Seguro:</strong> R$ {reserva.seguro.toFixed(2)}</p>
              <p><strong>Outros:</strong> R$ {reserva.outros.toFixed(2)}</p>
              <p className="font-bold text-sm pt-1"><strong>Valor Total:</strong> R$ {reserva.total.toFixed(2)}</p>
              <p><strong>Desconto:</strong> R$ 0,00</p>
              <p className="font-bold text-sm"><strong>Valor a Pagar:</strong> R$ {reserva.total.toFixed(2)}</p>
              <p className="font-bold pt-1">FORMA PAGAMENTO: VALOR PAGO</p>
              <p><strong>Crédito DT:</strong> R$ {reserva.total.toFixed(2)}</p>
              <p><strong>Troco:</strong> R$ 0,00</p>
            </div>
          </div>

          {/* CHAVE BPe */}
          <div className="border-b p-2 text-center">
            <p className="text-xs mb-1">Consulta pela Chave de Acesso em</p>
            <p className="text-xs text-blue-600">http://bpe.svrs.rs.gov.br/consulta</p>
            <p className="font-mono text-xs my-1">{reserva.chaveBpe.match(/.{1,4}/g)?.join(' ')}</p>
            <div className="flex justify-center my-2">
              <QRCodeSVG value={reserva.qrCodeBpe} size={100} level="M" />
            </div>
          </div>

          {/* QR CODE EMBARQUE ÔNIBUS (MONITRIIP) E PASSAGEIRO */}
          <div className="border-b p-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <QRCodeSVG value={reserva.qrCode} size={120} level="M" className="mx-auto mb-1" />
                <p className="font-bold text-xs">Embarque no Ônibus</p>
                <p className="text-xs">(Monitriip)</p>
              </div>
              <div className="text-xs">
                <p><strong>Passageiro(a)</strong> DOC {reserva.passageiro.documento} - {reserva.passageiro.nome.toUpperCase()}</p>
                <p><strong>TIPO DE DESCONTO</strong> Normal</p>
                <p><strong>Documento de desconto</strong> ---</p>
                <p className="mt-2"><strong>BP-e nº:</strong> {reserva.numeroBPe} <strong>Série:</strong> {reserva.serie}</p>
                <p><strong>Data de emissão:</strong> {new Date(reserva.dataEmissao).toLocaleString('pt-BR')}</p>
                <p><strong>Protocolo de autorização:</strong> {reserva.protocolo}</p>
                <p><strong>Nº bilhete:</strong> {reserva.numeroBilhete}</p>
                <p><strong>Localizador:</strong> {reserva.localizador}</p>
              </div>
            </div>
          </div>

          {/* QR CODE PORTÃO */}
          <div className="border-b p-2 text-center">
            <div className="flex justify-center mb-1">
              <QRCodeSVG value={reserva.qrCodeTaxaEmbarque} size={100} level="M" />
            </div>
            <p className="font-bold text-xs">Acesso ao Portão de Embarque</p>
          </div>

          {/* RODAPÉ */}
          <div className="p-2">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-bold mb-1">Passageiro, consulte seus direitos e deveres</p>
                <div className="flex justify-center my-2">
                  <QRCodeSVG value="https://www.goodtrip.com.br/direitos" size={60} level="M" />
                </div>
                <p>Aponte a câmera do seu celular ou acesse</p>
                <p className="text-blue-600 underline">Obtenha um livreto aqui</p>
                <p className="mt-1 text-xs">Artigo 143, Item VII da Resolução 6.033 de 21 de dezembro de 2023</p>
              </div>
              <div>
                <p className="font-bold mb-1">Beneficiários de Passe Livre Idosos e ID Jovem</p>
                <p>É obrigatório o comparecimento para o embarque com pelo menos 30 minutos antes da hora da partida prevista. Também é obrigatória a apresentação dos documentos que comprovam o direito ao benefício no momento do embarque. O não cumprimento destas orientações poderá acarretar a perda do benefício.</p>
                <p className="mt-1 text-xs">Artigo 143, parágrafos 1º e 2º da Resolução 6.033 de 21 de dezembro de 2023</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}