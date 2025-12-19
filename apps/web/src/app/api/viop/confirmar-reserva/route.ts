// apps/web/src/app/api/viop/confirmar-reserva/route.ts
import { NextRequest, NextResponse } from "next/server";
import { kv } from '@vercel/kv';

const VIOP_BASE = "https://apiouroprata.rjconsultores.com.br/api-gateway";
const TENANT = "36906f34-b731-46bc-a19d-a6d8923ac2e7";
const AUTH = "Basic R09PRFRSSVBBUEk6QGcxdDIj";

const MODO_TESTE = false;

type ReservaData = {
  servico: string;
  origem: string;
  destino: string;
  data: string;
  assentos: string[];
  passageiro: {
    nome: string;
    sobrenome: string;
    documento: string;
    email: string;
  };
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

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status } = body;

    console.log('📝 Iniciando emissão de bilhete:', { orderId, status, MODO_TESTE });

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

    if (MODO_TESTE) {
      console.log('🧪 MODO TESTE - Simulando emissão de bilhete...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const localizadorSimulado = `TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      return NextResponse.json({
        localizador: localizadorSimulado,
        status: 'CONFIRMADO',
        numeroBilhete: `SIM-${Date.now()}`,
        numeroSistema: `${Date.now()}`,
        poltrona: reservaData.assentos[0],
        servico: reservaData.servico,
        total: reservaData.preco * reservaData.assentos.length,
        origemNome: "ITAITUBA - PA",
        destinoNome: "KM 30 (CAMPO VERDE) - PA",
        data: reservaData.data,
        dataFormatada: new Date(reservaData.data).toLocaleDateString('pt-BR'),
        horarioSaida: "14:40",
        horarioChegada: "15:30",
        duracaoFormatada: "50min",
        empresa: "VIACAO OURO E PRATA S.A.",
        classe: "SEMILEITO",
        assentos: reservaData.assentos,
        passageiro: {
          nome: `${reservaData.passageiro.nome} ${reservaData.passageiro.sobrenome}`,
          documento: reservaData.passageiro.documento,
          email: reservaData.passageiro.email,
        },
        chaveBpe: 'SIMULADO_CHAVE_BPE_123456789',
        qrCode: 'SIMULADO_QR_MONITRIIP',
        qrCodeBpe: 'https://exemplo.com/qr-code-simulado.png',
        qrCodeTaxaEmbarque: 'SIMULADO_QR_TAXA_EMBARQUE',
        tarifa: 33.00,
        pedagio: 0,
        taxaEmbarque: 5,
        seguro: 1.5,
        outros: 0,
        numeroBPe: "999999",
        serie: "001",
        protocolo: "999999999999999",
        dataEmissao: new Date().toISOString(),
        prefixo: "RSPA0088022",
        plataforma: "3",
        linha: "PORTO ALEGRE(RS)-SANTAREM(PA)",
        cabecalhoAgencia: {
          razaoSocial: "GOOD TRIP TRANSPORTE E TURISMO LTDA",
          cnpj: "38.627.614/0001-70",
          endereco: "AG GETULIO VARGAS",
          numero: "519",
          bairro: "CENTRO",
          cidade: "ITAITUBA",
          uf: "PA"
        },
        cabecalhoEmitente: {
          razaoSocial: "VIACAO OURO E PRATA S.A.",
          cnpj: "92954106004725",
          inscricaoEstadual: "154581976",
          endereco: "TV DUQUE DE CAXIAS",
          numero: "200",
          bairro: "AMPARO",
          cidade: "SANTAREM",
          uf: "PA",
          cep: "68035620"
        },
        dataHoraEmbarqueInicio: "27/12/2025 14:25",
        dataHoraEmbarqueFim: "27/12/2025 14:39",
        _teste: true,
      });
    }

    // 🔒 PASSO 1: Bloquear Poltrona
    console.log('🔒 Bloqueando poltrona na VIOP...');
    const bloqueio = await bloquearPoltrona(reservaData);

    if (!bloqueio.transacao) {
      throw new Error('Bloqueio não retornou transacao');
    }

    console.log('✅ Poltrona bloqueada! Transacao:', bloqueio.transacao);
    console.log('⏱️  Duração do bloqueio:', bloqueio.duracao, 'segundos');

    // 💳 PASSO 2: Confirmar Venda (emitir bilhete)
    console.log('💳 Confirmando venda e emitindo bilhete...');
    const confirmacao = await confirmarVenda(reservaData, bloqueio);

    if (!confirmacao.localizador) {
      throw new Error('Venda não retornou localizador');
    }

    console.log('🎉 BILHETE EMITIDO! Localizador:', confirmacao.localizador);

    // 🔥 Retornar dados completos para o frontend
    return NextResponse.json({
      localizador: confirmacao.localizador,
      status: 'CONFIRMADO',
      numeroBilhete: confirmacao.numeroBilhete,
      numeroSistema: confirmacao.numeroSistema,
      poltrona: confirmacao.poltrona,
      servico: confirmacao.servico,
      total: reservaData.preco * reservaData.assentos.length,
      origemNome: confirmacao.descOrigem || bloqueio.origem?.cidade,
      destinoNome: confirmacao.descDestino || bloqueio.destino?.cidade,
      data: reservaData.data,
      dataFormatada: new Date(reservaData.data).toLocaleDateString('pt-BR'),
      horarioSaida: bloqueio.dataSaida?.split(' ')[1] || '',
      horarioChegada: bloqueio.dataChegada?.split(' ')[1] || '',
      duracaoFormatada: calcularDuracao(bloqueio.dataSaida, bloqueio.dataChegada),
      empresa: confirmacao.bpe?.linha || bloqueio.linha,
      classe: confirmacao.bpe?.classe || getClasseNome(bloqueio.classeServicoId),
      assentos: [confirmacao.poltrona],
      passageiro: {
        nome: confirmacao.nome,
        documento: confirmacao.documento,
        email: reservaData.passageiro.email,
      },
      // 🔥 DADOS DO BPe
      chaveBpe: confirmacao.bpe?.chaveBpe,
      qrCode: confirmacao.bpe?.codigoMonitriipBPe, // QR Code embarque ônibus (Monitriip)
      qrCodeBpe: confirmacao.bpe?.qrcodeBpe, // QR Code fiscal
      qrCodeTaxaEmbarque: confirmacao.cupomTaxaEmbarque, // QR Code taxa embarque rodoviária
      tarifa: parseFloat(confirmacao.bpe?.tarifa || '0'),
      pedagio: parseFloat(confirmacao.bpe?.pedagio || '0'),
      taxaEmbarque: parseFloat(confirmacao.bpe?.taxaEmbarque || '0'),
      seguro: parseFloat(confirmacao.bpe?.seguro || '0'),
      outros: parseFloat(confirmacao.bpe?.outros || '0'),
      numeroBPe: confirmacao.bpe?.numeroBpe,
      serie: confirmacao.bpe?.serie,
      protocolo: confirmacao.bpe?.protocoloAutorizacao,
      dataEmissao: confirmacao.bpe?.dataAutorizacao,
      // 🔥 NOVOS CAMPOS ADICIONADOS
      prefixo: confirmacao.bpe?.prefixo,
      plataforma: confirmacao.bpe?.plataforma,
      linha: confirmacao.bpe?.linha,
      cabecalhoAgencia: confirmacao.bpe?.cabecalhoAgencia,
      cabecalhoEmitente: confirmacao.bpe?.cabecalhoEmitente,
      dataHoraEmbarqueInicio: confirmacao.bpe?.dataHoraEmbarqueInicio,
      dataHoraEmbarqueFim: confirmacao.bpe?.dataHoraEmbarqueFim,
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

// 🔒 PASSO 1: Bloquear Poltrona
async function bloquearPoltrona(reserva: ReservaData) {
  const url = `${VIOP_BASE}/bloqueiopoltrona/bloquearPoltrona`;
  
  const payload = {
    origem: parseInt(reserva.origem),
    destino: parseInt(reserva.destino),
    data: reserva.data,
    servico: parseInt(reserva.servico),
    poltrona: reserva.assentos[0],
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
    throw new Error(`Erro ao bloquear poltrona: ${res.status}`);
  }

  const response = await res.json();
  console.log('✅ Resposta bloquearPoltrona:', response);
  
  return response;
}

// 💳 PASSO 2: Confirmar Venda
async function confirmarVenda(reserva: ReservaData, bloqueioResponse: BloqueioResponse) {
  const url = `${VIOP_BASE}/confirmavenda/confirmarVenda`;
  
  const payload = {
    transacao: bloqueioResponse.transacao,
    nomePassageiro: `${reserva.passageiro.nome} ${reserva.passageiro.sobrenome}`,
    documentoPassageiro: reserva.passageiro.documento,
    tipoDocumentoPassageiro: "CPF",
    email: reserva.passageiro.email,
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