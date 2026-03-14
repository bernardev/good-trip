// apps/web/src/app/api/admin/emitir-bilhete-manual/route.ts
import { NextRequest, NextResponse } from "next/server";
import { kv } from '@vercel/kv';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { enviarEmailBilheteAdmin, enviarEmailBilheteCliente } from '@/lib/enviar-email-bilhete';
import { notificarAdmin } from '@/lib/notificacoes-admin';

const VIOP_BASE = "https://apiouroprata.rjconsultores.com.br/api-gateway";
const TENANT = "36906f34-b731-46bc-a19d-a6d8923ac2e7";
const AUTH = "Basic R09PRFRSSVBBUEk6QGcxdDIj";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Passageiro = {
  nomeCompleto: string;
  docNumero: string;
  docTipo: string;
  email?: string;
  telefone?: string;
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
    cabecalhoAgencia?: Record<string, string>;
    cabecalhoEmitente?: Record<string, string>;
    dataHoraEmbarqueInicio?: string;
    dataHoraEmbarqueFim?: string;
    customizacaoRodapeCupomDeEmbarque?: string;
  };
  cupomTaxaEmbarque?: string;
  orgaoConcedenteId?: number;
};

type RequestBody = {
  servico: string;
  origem: string;
  destino: string;
  data: string;
  assento: string;
  passageiro: Passageiro;
  orderId?: string;
};

export async function POST(req: NextRequest) {
  // Auth: verificar sessão admin
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body: RequestBody = await req.json();
    const { servico, origem, destino, data, assento, passageiro, orderId } = body;

    console.log('🔧 [ADMIN] Emissão manual de bilhete:', { servico, origem, destino, data, assento, passageiro: passageiro.nomeCompleto, orderId });

    // 1. Bloquear poltrona
    console.log(`🔒 Bloqueando assento ${assento}...`);
    const bloqueio = await bloquearPoltrona({ servico, origem, destino, data }, assento);

    if (!bloqueio.transacao) {
      throw new Error(`Bloqueio não retornou transacao para assento ${assento}`);
    }
    console.log(`✅ Assento ${assento} bloqueado! Transacao: ${bloqueio.transacao}`);

    // 2. Confirmar venda
    console.log(`💳 Confirmando venda do assento ${assento}...`);
    const confirmacao = await confirmarVenda(bloqueio, passageiro);

    if (!confirmacao.localizador) {
      throw new Error(`Venda não retornou localizador para assento ${assento}`);
    }
    console.log(`🎉 Bilhete emitido! Localizador: ${confirmacao.localizador}`);

    // 3. Montar dados do bilhete
    const tarifaBPe = parseFloat(confirmacao.bpe?.tarifa || '0');
    const pedagogioBPe = parseFloat(confirmacao.bpe?.pedagio || '0');
    const taxaEmbarqueBPe = parseFloat(confirmacao.bpe?.taxaEmbarque || '0');
    const seguroBPe = parseFloat(confirmacao.bpe?.seguro || '0');
    const outrosBPe = parseFloat(confirmacao.bpe?.outros || '0');
    const valorTotal = tarifaBPe + pedagogioBPe + taxaEmbarqueBPe + seguroBPe + outrosBPe;

    const bilheteData = {
      localizador: confirmacao.localizador,
      status: 'CONFIRMADO',
      numeroBilhete: confirmacao.numeroBilhete,
      numeroSistema: confirmacao.numeroSistema,
      poltrona: confirmacao.poltrona,
      servico: confirmacao.servico,
      total: valorTotal,
      origemNome: confirmacao.descOrigem || bloqueio.origem?.cidade,
      destinoNome: confirmacao.descDestino || bloqueio.destino?.cidade,
      data,
      dataFormatada: new Date(data).toLocaleDateString('pt-BR'),
      horarioSaida: bloqueio.dataSaida?.split(' ')[1] || '',
      horarioChegada: bloqueio.dataChegada?.split(' ')[1] || '',
      empresa: confirmacao.bpe?.linha || bloqueio.linha,
      classe: confirmacao.bpe?.classe,
      assentos: [confirmacao.poltrona],
      localizadores: [confirmacao.localizador],
      passageiro: {
        nome: confirmacao.nome,
        documento: confirmacao.documento,
        email: passageiro.email || '',
      },
      passageiros: [passageiro],
      bilhetes: [{
        assento: confirmacao.poltrona,
        localizador: confirmacao.localizador,
        numeroBilhete: confirmacao.numeroBilhete,
        passageiro,
      }],
      chaveBpe: confirmacao.bpe?.chaveBpe,
      qrCode: confirmacao.bpe?.codigoMonitriipBPe,
      qrCodeBpe: confirmacao.bpe?.qrcodeBpe,
      qrCodeTaxaEmbarque: confirmacao.cupomTaxaEmbarque,
      tarifa: tarifaBPe,
      pedagio: pedagogioBPe,
      taxaEmbarque: taxaEmbarqueBPe,
      seguro: seguroBPe,
      outros: outrosBPe,
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
      _emissaoManual: true,
    };

    // 4. Salvar no KV com chave individual por assento
    const kvKey = orderId ? `bilhete-manual:${orderId}:${assento}` : `bilhete-manual:${confirmacao.localizador}`;
    await kv.set(kvKey, bilheteData, { ex: 2592000 }); // 30 dias
    console.log(`💾 Bilhete salvo no KV: ${kvKey}`);

    // 5. Também salvar como bilhete:orderId para gerar PDF (temporário, sobrescrito por assento)
    const pdfOrderId = orderId ? `${orderId}-${assento}` : confirmacao.localizador;
    await kv.set(`bilhete:${pdfOrderId}`, bilheteData, { ex: 2592000 });

    // 6. Gerar PDF e enviar emails (fire-and-forget)
    (async () => {
      try {
        const pdfBuffer = await gerarPDFBilhete(pdfOrderId);
        if (!pdfBuffer) {
          console.error('⚠️ Não foi possível gerar PDF');
          return;
        }

        const emailData = {
          localizador: bilheteData.localizador,
          numeroBilhete: bilheteData.numeroBilhete || '',
          origem: bilheteData.origemNome || '',
          destino: bilheteData.destinoNome || '',
          data: bilheteData.dataFormatada || '',
          horario: bilheteData.horarioSaida || '',
          assentos: bilheteData.assentos,
          passageiro: passageiro.nomeCompleto,
          emailCliente: passageiro.email || '',
          valor: bilheteData.total,
        };

        await enviarEmailBilheteAdmin(pdfBuffer, emailData);
        console.log('✅ Email enviado para admin');

        if (passageiro.email) {
          await enviarEmailBilheteCliente(pdfBuffer, emailData);
          console.log(`✅ Email enviado para cliente: ${passageiro.email}`);
        }
      } catch (error) {
        console.error('⚠️ Erro ao enviar emails:', error);
      }
    })();

    // 7. Notificar admin
    notificarAdmin({
      ip: 'admin-manual',
      tipo: 'BILHETE_EMITIDO',
      orderId: orderId || confirmacao.localizador,
      passageiro: passageiro.nomeCompleto,
      origem: bilheteData.origemNome,
      destino: bilheteData.destinoNome,
      assentos: bilheteData.assentos,
      valor: bilheteData.total,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      message: `Bilhete emitido manualmente! Assento ${assento}, Localizador: ${confirmacao.localizador}`,
      ...bilheteData,
    });

  } catch (error) {
    const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ [ADMIN] Erro ao emitir bilhete manual:', mensagemErro);

    return NextResponse.json(
      { error: mensagemErro, status: 'ERRO' },
      { status: 500 }
    );
  }
}

// --- Funções auxiliares (mesmas do confirmar-reserva) ---

async function bloquearPoltrona(
  reserva: { servico: string; origem: string; destino: string; data: string },
  assento: string
): Promise<BloqueioResponse> {
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
    let mensagemViop = `Erro ${res.status}`;
    try {
      const erroJson = JSON.parse(text);
      mensagemViop = erroJson.mensagem || erroJson.message || erroJson.error || mensagemViop;
    } catch {
      if (text) mensagemViop = text;
    }
    throw new Error(`Poltrona ${assento}: ${mensagemViop}`);
  }

  return await res.json();
}

async function confirmarVenda(
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
    telefone: passageiro.telefone?.replace(/\D/g, '') || '93000000000',
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
    throw new Error(`Erro ao confirmar venda: ${res.status} - ${text}`);
  }

  const response = await res.json();
  console.log('=== RESPONSE confirmarVenda ===');
  console.log(JSON.stringify(response, null, 2));
  return response as ConfirmacaoResponse;
}

async function gerarPDFBilhete(orderId: string): Promise<Buffer | null> {
  try {
    console.log('📄 Gerando PDF do bilhete...');

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/viop/gerar-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
      console.error('❌ Erro ao gerar PDF:', response.status);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    return null;
  }
}
