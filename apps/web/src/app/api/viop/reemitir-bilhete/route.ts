// apps/web/src/app/api/viop/reemitir-bilhete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { kv } from '@vercel/kv';

const VIOP_BASE = "https://apiouroprata.rjconsultores.com.br/api-gateway";
const TENANT = "36906f34-b731-46bc-a19d-a6d8923ac2e7";
const AUTH = "Basic R09PRFRSSVBBUEk6QGcxdDIj";

type Passageiro = {
  assento: string;
  nomeCompleto: string;
  docNumero: string;
  docTipo: string;
  nacionalidade: string;
  telefone: string;
  email?: string;
};

type ReservaData = {
  servico: string;
  origem: string;
  destino: string;
  data: string;
  assentos: string[];
  passageiros: Passageiro[];
  preco: number;
};

type BloqueioResponse = {
  transacao: string;
  numOperacion: string;
  localizador: string;
  duracao: number;
  dataSaida?: string;
  dataChegada?: string;
  origem?: { cidade: string; id: number };
  destino?: { cidade: string; id: number };
  linha?: string;
  classeServicoId?: number;
};

type BPEData = {
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
  cabecalhoAgencia?: {
    razaoSocial?: string;
    cnpj?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
  };
  cabecalhoEmitente?: {
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
  dataHoraEmbarqueInicio?: string;
  dataHoraEmbarqueFim?: string;
  customizacaoRodapeCupomDeEmbarque?: string;
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
  bpe?: BPEData;
  cupomTaxaEmbarque?: string;
  orgaoConcedenteId?: number;
};

export async function POST(req: NextRequest) {
  try {
    const { orderId, novoAssento } = await req.json();

    console.log('🔄 Iniciando re-emissão de bilhete:', { orderId, novoAssento });

    // 1️⃣ Buscar dados originais da reserva
    const reservaData = await kv.get(`reserva:${orderId}`);
    if (!reservaData) {
      return NextResponse.json(
        { error: 'Reserva não encontrada' },
        { status: 404 }
      );
    }

    const reserva = typeof reservaData === 'string' ? JSON.parse(reservaData) : reservaData;
    console.log('✅ Dados da reserva recuperados');

    // 2️⃣ Atualizar assento na reserva
    const assentoAntigo = reserva.assentos[0];
    reserva.assentos = [novoAssento];
    reserva.passageiros[0].assento = novoAssento;

    console.log(`📝 Alterando assento: ${assentoAntigo} → ${novoAssento}`);

    // 3️⃣ Bloquear novo assento
    console.log(`🔒 Bloqueando assento ${novoAssento}...`);
    const bloqueio = await bloquearPoltrona(reserva, novoAssento);

    if (!bloqueio.transacao) {
      throw new Error('Falha ao bloquear novo assento');
    }

    console.log(`✅ Assento ${novoAssento} bloqueado! Transacao: ${bloqueio.transacao}`);

    // 4️⃣ Confirmar venda
    console.log('💳 Confirmando venda...');
    const confirmacao = await confirmarVenda(reserva, bloqueio, reserva.passageiros[0]);

    if (!confirmacao.localizador) {
      throw new Error('Venda não retornou localizador');
    }

    console.log(`🎉 Bilhete re-emitido! Localizador: ${confirmacao.localizador}`);

    // 5️⃣ Montar resposta
    const responseData = {
      localizador: confirmacao.localizador,
      status: 'CONFIRMADO',
      numeroBilhete: confirmacao.numeroBilhete,
      numeroSistema: confirmacao.numeroSistema,
      poltrona: confirmacao.poltrona,
      servico: confirmacao.servico,
      total: reserva.preco,
      origemNome: confirmacao.descOrigem || bloqueio.origem?.cidade,
      destinoNome: confirmacao.descDestino || bloqueio.destino?.cidade,
      data: reserva.data,
      dataFormatada: new Date(reserva.data).toLocaleDateString('pt-BR'),
      horarioSaida: bloqueio.dataSaida?.split(' ')[1] || '',
      horarioChegada: bloqueio.dataChegada?.split(' ')[1] || '',
      empresa: confirmacao.bpe?.linha || bloqueio.linha,
      classe: confirmacao.bpe?.classe,
      assentos: [confirmacao.poltrona],
      localizadores: [confirmacao.localizador],
      passageiro: {
        nome: confirmacao.nome,
        documento: confirmacao.documento,
        email: reserva.passageiros[0]?.email || '',
        telefone: reserva.passageiros[0]?.telefone || '',
      },
      passageiros: reserva.passageiros,
      bilhetes: [{
        assento: confirmacao.poltrona,
        localizador: confirmacao.localizador,
        numeroBilhete: confirmacao.numeroBilhete,
        passageiro: reserva.passageiros[0]
      }],
      chaveBpe: confirmacao.bpe?.chaveBpe,
      qrCodeBpe: confirmacao.bpe?.qrcodeBpe,
      qrCodeTaxaEmbarque: confirmacao.cupomTaxaEmbarque,
      tarifa: parseFloat(confirmacao.bpe?.tarifa || '0'),
      pedagio: parseFloat(confirmacao.bpe?.pedagio || '0'),
      taxaEmbarque: parseFloat(confirmacao.bpe?.taxaEmbarque || '0'),
      seguro: parseFloat(confirmacao.bpe?.seguro || '0'),
      outros: parseFloat(confirmacao.bpe?.outros || '0'),
      numeroBPe: confirmacao.bpe?.numeroBpe,
      serie: confirmacao.bpe?.serie,
      protocolo: confirmacao.bpe?.protocoloAutorizacao,
      dataEmissao: confirmacao.bpe?.dataAutorizacao,
      prefixo: confirmacao.bpe?.prefixo,
      plataforma: confirmacao.bpe?.plataforma,
      linha: confirmacao.bpe?.linha,
      cabecalhoAgencia: confirmacao.bpe?.cabecalhoAgencia,
      cabecalhoEmitente: confirmacao.bpe?.cabecalhoEmitente,
      dataHoraEmbarqueInicio: confirmacao.bpe?.dataHoraEmbarqueInicio,
      dataHoraEmbarqueFim: confirmacao.bpe?.dataHoraEmbarqueFim,
      orgaoConcedenteId: confirmacao.orgaoConcedenteId,
      customizacaoRodapeCupomDeEmbarque: confirmacao.bpe?.customizacaoRodapeCupomDeEmbarque,
      _reemitido: true,
      _assentoAntigo: assentoAntigo,
    };

    // 6️⃣ Sobrescrever cache com novo bilhete
    await kv.set(`bilhete:${orderId}`, responseData, { ex: 2592000 });
    console.log('💾 Cache atualizado com novo bilhete');

    // 7️⃣ Atualizar reserva com novo assento
    await kv.set(`reserva:${orderId}`, reserva);
    console.log('💾 Reserva atualizada com novo assento');

    return NextResponse.json({
      success: true,
      message: `Bilhete re-emitido com sucesso! Assento: ${assentoAntigo} → ${novoAssento}`,
      ...responseData
    });

  } catch (error) {
    const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao re-emitir bilhete:', mensagemErro);
    
    return NextResponse.json(
      { 
        error: mensagemErro,
        status: 'ERRO',
      },
      { status: 500 }
    );
  }
}

async function bloquearPoltrona(reserva: ReservaData, assento: string): Promise<BloqueioResponse> {
  const url = `${VIOP_BASE}/bloqueiopoltrona/bloquearPoltrona`;
  
  const payload = {
    origem: parseInt(reserva.origem),
    destino: parseInt(reserva.destino),
    data: reserva.data,
    servico: parseInt(reserva.servico),
    poltrona: assento,
    volta: false,
  };

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
    throw new Error(`Erro ao bloquear poltrona ${assento}: ${res.status} - ${text}`);
  }

  return await res.json();
}

async function confirmarVenda(
  reserva: ReservaData, 
  bloqueioResponse: BloqueioResponse,
  passageiro: Passageiro
): Promise<ConfirmacaoResponse> {
  const url = `${VIOP_BASE}/confirmavenda/confirmarVenda`;
  
  const payload = {
    transacao: bloqueioResponse.transacao,
    nomePassageiro: passageiro.nomeCompleto,
    documentoPassageiro: passageiro.docNumero,
    tipoDocumentoPassageiro: "CPF",
    email: passageiro.email || 'naotemmail@goodtrip.com.br',
    telefone: passageiro.telefone.replace(/\D/g, ''),
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
    throw new Error(`Erro ao confirmar venda: ${res.status} - ${text}`);
  }

  return await res.json();
}