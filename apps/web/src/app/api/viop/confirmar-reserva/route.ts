// apps/web/src/app/api/viop/confirmar-reserva/route.ts
import { NextRequest, NextResponse } from "next/server";
import { kv } from '@vercel/kv';

const VIOP_BASE = "https://apiouroprata.rjconsultores.com.br/api-gateway";
const TENANT = "36906f34-b731-46bc-a19d-a6d8923ac2e7";
const AUTH = "Basic R09PRFRSSVBBUEk6QGcxdDIj";

type ReservaData = {
  servico: string;
  origem: string;
  destino: string;
  data: string;
  assentos: string[];
  passageiros: Array<{
    assento: string;
    nome: string;
    sobrenome: string;
    documento: string;
    email: string;
  }>;
  preco: number;
};

type BloqueioResponse = {
  transacao: string;
  numOperacion: string;
  localizador: string;
  duracao: number;
  dataSaida?: string;
  dataChegada?: string;
  origem?: { cidade: string };
  destino?: { cidade: string };
  linha?: string;
  classeServicoId?: number;
};

type CabecalhoAgencia = {
  razaoSocial?: string;
  cnpj?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
};

type CabecalhoEmitente = {
  razaoSocial?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
};

type ConfirmacaoResponse = {
  localizador: string;
  numeroBilhete: string;
  numeroSistema: string;
  poltrona: string;
  servico: string;
  descOrigem?: string;
  descDestino?: string;
  nome: string;
  documento: string;
  bpe?: {
    chaveBpe?: string;
    codigoMonitriipBPe?: string;
    qrcodeBpe?: string;
    tarifa?: string;
    pedagio?: string;
    taxaEmbarque?: string;
    seguro?: string;
    outros?: string;
    numeroBpe?: string;
    serie?: string;
    protocoloAutorizacao?: string;
    dataAutorizacao?: string;
    prefixo?: string;
    plataforma?: string;
    linha?: string;
    classe?: string;
    cabecalhoAgencia?: CabecalhoAgencia;
    cabecalhoEmitente?: CabecalhoEmitente;
    dataHoraEmbarqueInicio?: string;
    dataHoraEmbarqueFim?: string;
  };
  cupomTaxaEmbarque?: string;
};

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status } = body;

    console.log('📝 Iniciando emissão de bilhete:', { orderId, status });

    if (status !== 'paid' && status !== 'approved') {
      return NextResponse.json(
        { error: 'Pagamento não aprovado', status: 'NEGADO' },
        { status: 400 }
      );
    }

    const reservaData = await buscarDadosReserva(orderId);

    if (!reservaData) {
      return NextResponse.json(
        { error: 'Dados da reserva não encontrados' },
        { status: 404 }
      );
    }

    // 🔥 Processar múltiplos assentos
    console.log(`🎫 Processando ${reservaData.assentos.length} assento(s)...`);
    
    const bilhetesEmitidos: ConfirmacaoResponse[] = [];
    let primeiroBloqueioDados: BloqueioResponse | null = null;

    for (let i = 0; i < reservaData.assentos.length; i++) {
      const assento = reservaData.assentos[i];
      console.log(`\n🔒 [${i + 1}/${reservaData.assentos.length}] Bloqueando assento ${assento}...`);

      const bloqueio = await bloquearPoltronaIndividual(reservaData, assento);

      if (!bloqueio.transacao) {
        throw new Error(`Bloqueio não retornou transacao para assento ${assento}`);
      }

      if (i === 0) {
        primeiroBloqueioDados = bloqueio;
      }

      console.log(`✅ Assento ${assento} bloqueado! Transacao: ${bloqueio.transacao}`);

      // 🔥 Usar dados do passageiro correto para este assento
      const passageiroAssento = reservaData.passageiros.find(p => p.assento === assento) || reservaData.passageiros[i];

      console.log(`💳 Confirmando venda do assento ${assento}...`);
      const confirmacao = await confirmarVenda(reservaData, bloqueio, passageiroAssento);

      if (!confirmacao.localizador) {
        throw new Error(`Venda não retornou localizador para assento ${assento}`);
      }

      console.log(`🎉 Bilhete emitido! Localizador: ${confirmacao.localizador}`);
      bilhetesEmitidos.push(confirmacao);
    }

    console.log(`\n✅ Todos os ${bilhetesEmitidos.length} bilhetes foram emitidos com sucesso!`);

    const primeiroBilhete = bilhetesEmitidos[0];
    const bloqueioRef = primeiroBloqueioDados!;

    return NextResponse.json({
      localizador: primeiroBilhete.localizador,
      status: 'CONFIRMADO',
      numeroBilhete: primeiroBilhete.numeroBilhete,
      numeroSistema: primeiroBilhete.numeroSistema,
      poltrona: primeiroBilhete.poltrona,
      servico: primeiroBilhete.servico,
      total: reservaData.preco * reservaData.assentos.length,
      origemNome: primeiroBilhete.descOrigem || bloqueioRef.origem?.cidade,
      destinoNome: primeiroBilhete.descDestino || bloqueioRef.destino?.cidade,
      data: reservaData.data,
      dataFormatada: new Date(reservaData.data).toLocaleDateString('pt-BR'),
      horarioSaida: bloqueioRef.dataSaida?.split(' ')[1] || '',
      horarioChegada: bloqueioRef.dataChegada?.split(' ')[1] || '',
      duracaoFormatada: calcularDuracao(bloqueioRef.dataSaida, bloqueioRef.dataChegada),
      empresa: primeiroBilhete.bpe?.linha || bloqueioRef.linha,
      classe: primeiroBilhete.bpe?.classe || getClasseNome(bloqueioRef.classeServicoId),
      assentos: bilhetesEmitidos.map(b => b.poltrona),
      localizadores: bilhetesEmitidos.map(b => b.localizador),
      passageiro: {
        nome: primeiroBilhete.nome,
        documento: primeiroBilhete.documento,
        email: reservaData.passageiros[0]?.email || '',
      },
      chaveBpe: primeiroBilhete.bpe?.chaveBpe,
      qrCode: primeiroBilhete.bpe?.codigoMonitriipBPe,
      qrCodeBpe: primeiroBilhete.bpe?.qrcodeBpe,
      qrCodeTaxaEmbarque: primeiroBilhete.cupomTaxaEmbarque,
      tarifa: parseFloat(primeiroBilhete.bpe?.tarifa || '0'),
      pedagio: parseFloat(primeiroBilhete.bpe?.pedagio || '0'),
      taxaEmbarque: parseFloat(primeiroBilhete.bpe?.taxaEmbarque || '0'),
      seguro: parseFloat(primeiroBilhete.bpe?.seguro || '0'),
      outros: parseFloat(primeiroBilhete.bpe?.outros || '0'),
      numeroBPe: primeiroBilhete.bpe?.numeroBpe,
      serie: primeiroBilhete.bpe?.serie,
      protocolo: primeiroBilhete.bpe?.protocoloAutorizacao,
      dataEmissao: primeiroBilhete.bpe?.dataAutorizacao,
      prefixo: primeiroBilhete.bpe?.prefixo,
      plataforma: primeiroBilhete.bpe?.plataforma,
      linha: primeiroBilhete.bpe?.linha,
      cabecalhoAgencia: primeiroBilhete.bpe?.cabecalhoAgencia,
      cabecalhoEmitente: primeiroBilhete.bpe?.cabecalhoEmitente,
      dataHoraEmbarqueInicio: primeiroBilhete.bpe?.dataHoraEmbarqueInicio,
      dataHoraEmbarqueFim: primeiroBilhete.bpe?.dataHoraEmbarqueFim,
      _teste: false,
    });

  } catch (error) {
    console.error('❌ Erro ao confirmar reserva:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        status: 'NEGADO',
      },
      { status: 500 }
    );
  }
}

async function bloquearPoltronaIndividual(reserva: ReservaData, assento: string): Promise<BloqueioResponse> {
  const url = `${VIOP_BASE}/bloqueiopoltrona/bloquearPoltrona`;
  
  const payload = {
    origem: parseInt(reserva.origem),
    destino: parseInt(reserva.destino),
    data: reserva.data,
    servico: parseInt(reserva.servico),
    poltrona: assento,
    volta: false,
  };

  console.log('📤 Bloqueando poltrona:', payload);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-tenant-id': TENANT,
      'authorization': AUTH,
      'user-agent': 'PostmanRuntime/7.49.1',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('❌ Erro ao bloquear:', res.status, text);
    throw new Error(`Erro ao bloquear poltrona ${assento}: ${res.status}`);
  }

  const response = await res.json();
  console.log('✅ Resposta bloquearPoltrona:', response);
  
  return response;
}

// 🔥 Confirmar venda com dados do passageiro correto
async function confirmarVenda(
  reserva: ReservaData, 
  bloqueioResponse: BloqueioResponse,
  passageiro: ReservaData['passageiros'][0]
): Promise<ConfirmacaoResponse> {
  const url = `${VIOP_BASE}/confirmavenda/confirmarVenda`;
  
  const payload = {
    transacao: bloqueioResponse.transacao,
    nomePassageiro: `${passageiro.nome} ${passageiro.sobrenome}`,
    documentoPassageiro: passageiro.documento,
    tipoDocumentoPassageiro: "CPF",
    email: passageiro.email,
    telefone: "41999999999",
    idFormaPagamento: 1,
    numOperacion: bloqueioResponse.numOperacion,
    localizador: bloqueioResponse.localizador,
    descontoId: 0,
    totalDescontoAplicado: 0,
    valorDescontoOutros: 0,
    valorDescontoPedagio: 0,
    valorDescontoSeguro: 0,
    valorDescontoTarifa: 0,
    valorDescontoTaxaEmbarque: 0,
  };

  console.log('📤 Confirmando venda:', payload);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-tenant-id': TENANT,
      'authorization': AUTH,
      'user-agent': 'PostmanRuntime/7.49.1',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('❌ Erro ao confirmar venda:', res.status, text);
    throw new Error(`Erro ao confirmar venda: ${res.status}`);
  }

  const response = await res.json();
  
  console.log('=== RESPONSE COMPLETA ===');
  console.log(JSON.stringify(response, null, 2));
  console.log('=== FIM ===');
  
  console.log('✅ Venda confirmada');
  
  return response;
}

async function buscarDadosReserva(orderId: string): Promise<ReservaData | null> {
  try {
    const data = await kv.get(`reserva:${orderId}`);
    if (!data) {
      console.error('❌ Reserva não encontrada no KV:', orderId);
      return null;
    }
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    console.log('✅ Dados da reserva recuperados do KV:', orderId);
    return parsed as ReservaData;
  } catch (error) {
    console.error('❌ Erro ao buscar reserva do KV:', error);
    return null;
  }
}

function calcularDuracao(saida?: string, chegada?: string): string {
  if (!saida || !chegada) return '—';
  
  try {
    const [dataSaida, horaSaida] = saida.split(' ');
    const [dataChegada, horaChegada] = chegada.split(' ');
    
    const dtSaida = new Date(`${dataSaida}T${horaSaida}`);
    const dtChegada = new Date(`${dataChegada}T${horaChegada}`);
    
    const diff = dtChegada.getTime() - dtSaida.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos.toString().padStart(2, '0')}min`;
  } catch {
    return '—';
  }
}

function getClasseNome(classeId?: number): string {
  if (!classeId) return 'CONVENCIONAL';
  
  const classes: Record<number, string> = {
    17: 'LEITO',
    1: 'CONVENCIONAL',
    2: 'EXECUTIVO',
    3: 'SEMI-LEITO',
    7: 'SEMILEITO',
  };
  return classes[classeId] || 'CONVENCIONAL';
}