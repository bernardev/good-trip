// apps/web/src/app/api/viop/confirmar-reserva/route.ts
import { NextRequest, NextResponse } from "next/server";
import { kv } from '@vercel/kv';
import { estornarAutomatico } from '@/lib/estorno';
import { enviarBilheteLinkWhatsApp } from '@/lib/evolution-whatsapp';
import { notificarAdmin } from '@/lib/notificacoes-admin';
import { enviarEmailBilheteAdmin } from '@/lib/enviar-email-bilhete';

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
  chargeId?: string;
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
  cabecalhoAgencia?: CabecalhoAgencia;
  cabecalhoEmitente?: CabecalhoEmitente;
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
  customizacaoRodapeCupomDeEmbarque?: string;
};

type CategoriaResponse = {
  orgaoConcedenteId?: number;
  orgaoConcedente?: {
    id: number;
    nome: string;
  };
};

type RequestBody = {
  orderId: string;
  status: string;
  // 🧪 TESTE: simular erro de poltrona ocupada (remover antes do deploy)
  simulate_error?: string;
};

export const dynamic = "force-dynamic";

// 🔥 ADICIONAR ESTA FUNÇÃO AQUI (ANTES DO export async function POST)
async function gerarPDFBilhete(orderId: string): Promise<Buffer | null> {
  try {
    console.log('📄 Gerando PDF do bilhete para envio por email...');
    
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
    console.error('❌ Erro ao gerar PDF para email:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const bilhetesEmitidos: ConfirmacaoResponse[] = [];
  let orderId = '';

  // Extrair IP do cliente para monitoramento (fora do try para estar acessível no catch)
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  try {
    const body: RequestBody = await req.json();
    const { orderId: orderIdFromBody, status, simulate_error } = body;
    orderId = orderIdFromBody;

    console.log('📝 Iniciando emissão de bilhete:', { orderId, status });

    const bilheteCache = await kv.get(`bilhete:${orderId}`);
    if (bilheteCache) {
      console.log('✅ Bilhete já emitido anteriormente (cache), retornando...');
      const cached = typeof bilheteCache === 'string' ? JSON.parse(bilheteCache) : bilheteCache;
      return NextResponse.json(cached);
    }

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

    console.log(`🎫 Processando ${reservaData.assentos.length} assento(s)...`);
    
    let primeiroBloqueioDados: BloqueioResponse | null = null;
    let orgaoConcedenteIdViagem: number | undefined;
    
    try {
      console.log('🔍 Consultando categorias para obter orgaoConcedenteId...');
      const categorias = await consultarCategorias(reservaData);
      orgaoConcedenteIdViagem = categorias.orgaoConcedenteId;
      console.log(`✅ orgaoConcedenteId obtido: ${orgaoConcedenteIdViagem || 'não informado pela API'}`);
    } catch (error) {
      console.warn('⚠️ Não foi possível obter orgaoConcedenteId das categorias:', error);
    }

    for (let i = 0; i < reservaData.assentos.length; i++) {
      const assento = reservaData.assentos[i];
      console.log(`\n🔒 [${i + 1}/${reservaData.assentos.length}] Bloqueando assento ${assento}...`);

      try {
        // 🧪 TESTE: simular erro de poltrona ocupada (remover antes do deploy)
        if (simulate_error === 'poltrona_ocupada') {
          console.log('🧪 SIMULANDO erro de poltrona ocupada para teste');
          const erro = new Error(`Poltrona ${assento}: A poltrona já foi selecionada`);
          (erro as Error & { codigoErro: string }).codigoErro = 'POLTRONA_OCUPADA';
          throw erro;
        }

        const bloqueio = await bloquearPoltronaIndividual(reservaData, assento);

        if (!bloqueio.transacao) {
          throw new Error(`Bloqueio não retornou transacao para assento ${assento}`);
        }

        if (i === 0) {
          primeiroBloqueioDados = bloqueio;
        }

        console.log(`✅ Assento ${assento} bloqueado! Transacao: ${bloqueio.transacao}`);

        const passageiroAssento = reservaData.passageiros.find(p => p.assento === assento) || reservaData.passageiros[i];

        console.log(`💳 Confirmando venda do assento ${assento}...`);
        const confirmacao = await confirmarVenda(reservaData, bloqueio, passageiroAssento);

        if (!confirmacao.localizador) {
          throw new Error(`Venda não retornou localizador para assento ${assento}`);
        }

        console.log(`🎉 Bilhete emitido! Localizador: ${confirmacao.localizador}`);
        bilhetesEmitidos.push(confirmacao);

      } catch (erroAssento) {
        const mensagemErro = erroAssento instanceof Error ? erroAssento.message : 'Erro desconhecido';
        const codigoErro = (erroAssento as Error & { codigoErro?: string }).codigoErro || 'ERRO_GENERICO';
        console.error(`❌ Erro ao processar assento ${assento} [${codigoErro}]:`, mensagemErro);
        
        notificarAdmin({ ip: clientIp,
          tipo: 'ERRO_EMISSAO',
          orderId,
          passageiro: reservaData.passageiros[0]?.nomeCompleto,
          origem: primeiroBloqueioDados?.origem?.cidade,
          destino: primeiroBloqueioDados?.destino?.cidade,
          valor: reservaData.preco,
          erro: `Falha no assento ${assento}`,
          detalhes: mensagemErro
        }).catch(console.error);
        
        console.log(`\n💸 Iniciando estorno automático...`);
        console.log(`📊 Situação: ${bilhetesEmitidos.length} de ${reservaData.assentos.length} bilhetes emitidos`);
        
        const resultadoEstorno = await estornarAutomatico(
          orderId,
          bilhetesEmitidos.length,
          `Falha na emissão do assento ${assento}: ${mensagemErro}`
        );

        if (resultadoEstorno.estornado) {
          console.log(`✅ Estorno processado: R$ ${resultadoEstorno.valorEstornado?.toFixed(2)}`);

          notificarAdmin({ ip: clientIp,
            tipo: 'ESTORNO_PROCESSADO',
            orderId,
            valorEstornado: resultadoEstorno.valorEstornado,
            motivo: `Falha na emissão do assento ${assento}: ${mensagemErro}`,
          }).catch(console.error);

          return NextResponse.json({
            error: `Erro ao emitir bilhetes. Estorno automático processado.`,
            status: 'NEGADO',
            codigoErro,
            estornoProcessado: true,
            valorEstornado: resultadoEstorno.valorEstornado,
            bilhetesEmitidos: bilhetesEmitidos.length,
            bilhetesEsperados: reservaData.assentos.length,
            detalhes: mensagemErro
          }, { status: 500 });
        } else {
          console.error(`❌ Falha ao processar estorno:`, resultadoEstorno.error);

          notificarAdmin({ ip: clientIp,
            tipo: 'ESTORNO_FALHOU',
            orderId,
            valor: reservaData.preco,
            erro: resultadoEstorno.error || 'Erro desconhecido no estorno',
          }).catch(console.error);

          return NextResponse.json({
            error: `Erro ao emitir bilhetes e processar estorno.`,
            status: 'NEGADO',
            codigoErro,
            estornoFalhou: true,
            bilhetesEmitidos: bilhetesEmitidos.length,
            bilhetesEsperados: reservaData.assentos.length,
            detalhes: mensagemErro,
            erroEstorno: resultadoEstorno.error
          }, { status: 500 });
        }
      }
    }

    console.log(`\n✅ Todos os ${bilhetesEmitidos.length} bilhetes foram emitidos com sucesso!`);

    const primeiroBilhete = bilhetesEmitidos[0];
    const bloqueioRef = primeiroBloqueioDados!;

    const tarifaBPe = parseFloat(primeiroBilhete.bpe?.tarifa || '0');
    const pedagogioBPe = parseFloat(primeiroBilhete.bpe?.pedagio || '0');
    const taxaEmbarqueBPe = parseFloat(primeiroBilhete.bpe?.taxaEmbarque || '0');
    const seguroBPe = parseFloat(primeiroBilhete.bpe?.seguro || '0');
    const outrosBPe = parseFloat(primeiroBilhete.bpe?.outros || '0');
    
    const valorTotalBPe = tarifaBPe + pedagogioBPe + taxaEmbarqueBPe + seguroBPe + outrosBPe;
    
    console.log('💰 Valores da BPe:', {
      tarifa: tarifaBPe,
      pedagio: pedagogioBPe,
      taxaEmbarque: taxaEmbarqueBPe,
      seguro: seguroBPe,
      outros: outrosBPe,
      total: valorTotalBPe
    });

    const responseData = {
      localizador: primeiroBilhete.localizador,
      status: 'CONFIRMADO',
      numeroBilhete: primeiroBilhete.numeroBilhete,
      numeroSistema: primeiroBilhete.numeroSistema,
      poltrona: primeiroBilhete.poltrona,
      servico: primeiroBilhete.servico,
      total: valorTotalBPe,
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
      passageiros: reservaData.passageiros,
      bilhetes: bilhetesEmitidos.map((bilhete, idx) => ({
        assento: bilhetesEmitidos[idx].poltrona,
        localizador: bilhete.localizador,
        numeroBilhete: bilhete.numeroBilhete,
        passageiro: reservaData.passageiros.find(
          p => p.assento === bilhetesEmitidos[idx].poltrona
        ) || reservaData.passageiros[idx]
      })),
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
      orgaoConcedenteId: orgaoConcedenteIdViagem || primeiroBilhete.orgaoConcedenteId,
      customizacaoRodapeCupomDeEmbarque: primeiroBilhete.bpe?.customizacaoRodapeCupomDeEmbarque,
      _teste: false,
    };

    await kv.set(`bilhete:${orderId}`, responseData, { ex: 2592000 });
    console.log('💾 Bilhete salvo no cache para futuras consultas');

    // 🔥 ADICIONAR TODO ESTE BLOCO AQUI (LOGO APÓS SALVAR NO CACHE)
    const primeiroPassageiro = reservaData.passageiros[0];
    
    // 📧 ENVIAR EMAIL PARA ADMIN (não bloqueia resposta)
    (async () => {
      try {
        console.log('📧 Iniciando envio de bilhete para admin...');
        
        const pdfBuffer = await gerarPDFBilhete(orderId);
        
        if (!pdfBuffer) {
          console.error('⚠️ Não foi possível gerar PDF para envio por email');
          return;
        }

        const resultado = await enviarEmailBilheteAdmin(pdfBuffer, {
          localizador: responseData.localizador || '',
          numeroBilhete: responseData.numeroBilhete || '',
          origem: responseData.origemNome || '',
          destino: responseData.destinoNome || '',
          data: responseData.dataFormatada || '',
          horario: responseData.horarioSaida || '',
          assentos: responseData.assentos,
          passageiro: primeiroPassageiro?.nomeCompleto || '',
          emailCliente: primeiroPassageiro?.email || '',
          valor: responseData.total,
        });

        if (resultado.sucesso) {
          console.log('✅ Email com bilhete enviado para admin!');
        } else {
          console.error('⚠️ Erro ao enviar email:', resultado.erro);
        }
      } catch (error) {
        console.error('⚠️ Erro ao enviar bilhete por email (não crítico):', error);
      }
    })();

    // 📱 ENVIAR WHATSAPP (continua igual)
    if (primeiroPassageiro?.telefone) {
      (async () => {
        try {
          await enviarBilheteLinkWhatsApp(
            primeiroPassageiro.telefone,
            orderId,
            {
              origem: responseData.origemNome || 'Origem',
              destino: responseData.destinoNome || 'Destino',
              data: responseData.dataFormatada || '',
              assentos: responseData.assentos,
              localizadores: responseData.localizadores
            }
          );
        } catch (error) {
          console.error('⚠️ Erro ao enviar link via WhatsApp (não crítico):', error);
        }
      })();
      
      console.log('📱 Enviando link do bilhete via WhatsApp...');
    }

    notificarAdmin({ ip: clientIp,
      tipo: 'BILHETE_EMITIDO',
      orderId,
      passageiro: primeiroPassageiro?.nomeCompleto,
      origem: responseData.origemNome,
      destino: responseData.destinoNome,
      assentos: responseData.assentos,
      valor: responseData.total
    }).catch(console.error);

    return NextResponse.json(responseData);

  } catch (error) {
    const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro fatal ao confirmar reserva:', mensagemErro);
    
    if (orderId) {
      notificarAdmin({ ip: clientIp,
        tipo: 'ERRO_EMISSAO',
        orderId,
        erro: 'Erro fatal',
        detalhes: mensagemErro
      }).catch(console.error);
    }
    
    if (orderId && bilhetesEmitidos.length > 0) {
      console.log(`\n💸 Erro fatal - Iniciando estorno automático...`);

      const resultadoEstorno = await estornarAutomatico(
        orderId,
        bilhetesEmitidos.length,
        `Erro fatal no processamento: ${mensagemErro}`
      );

      if (resultadoEstorno.estornado) {
        notificarAdmin({ ip: clientIp,
          tipo: 'ESTORNO_PROCESSADO',
          orderId,
          valorEstornado: resultadoEstorno.valorEstornado,
          motivo: `Erro fatal: ${mensagemErro}`,
        }).catch(console.error);

        return NextResponse.json({
          error: mensagemErro,
          status: 'NEGADO',
          estornoProcessado: true,
          valorEstornado: resultadoEstorno.valorEstornado
        }, { status: 500 });
      } else {
        notificarAdmin({ ip: clientIp,
          tipo: 'ESTORNO_FALHOU',
          orderId,
          erro: resultadoEstorno.error || 'Erro desconhecido no estorno',
        }).catch(console.error);
      }
    }
    
    return NextResponse.json(
      { 
        error: mensagemErro,
        status: 'NEGADO',
      },
      { status: 500 }
    );
  }
}

async function consultarCategorias(reserva: ReservaData): Promise<CategoriaResponse> {
  const url = `${VIOP_BASE}/categoria/consultarCategoriasCorrida`;
  
  const payload = {
    origem: parseInt(reserva.origem),
    destino: parseInt(reserva.destino),
    data: reserva.data,
    servico: parseInt(reserva.servico),
  };

  console.log('📤 Consultando categorias:', payload);

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
    console.error('❌ Erro ao consultar categorias:', res.status, text);
    throw new Error(`Erro ao consultar categorias: ${res.status}`);
  }

  const response: unknown = await res.json();
  console.log('✅ Resposta consultarCategorias:', response);
  
  return response as CategoriaResponse;
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

    // Parsear mensagem de erro da VIOP
    let mensagemViop = `Erro ${res.status}`;
    try {
      const erroJson = JSON.parse(text);
      mensagemViop = erroJson.mensagem || erroJson.message || erroJson.error || mensagemViop;
    } catch {
      if (text) mensagemViop = text;
    }

    const erro = new Error(`Poltrona ${assento}: ${mensagemViop}`);
    (erro as Error & { codigoErro: string }).codigoErro = mensagemViop.includes('já foi selecionada') ? 'POLTRONA_OCUPADA' : 'ERRO_BLOQUEIO';
    throw erro;
  }

  const response: unknown = await res.json();
  console.log('✅ Resposta bloquearPoltrona:', response);
  
  return response as BloqueioResponse;
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
    telefone: '93000000000',
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

  const response: unknown = await res.json();
  
  console.log('=== RESPONSE COMPLETA ===');
  console.log(JSON.stringify(response, null, 2));
  console.log('=== FIM ===');
  
  console.log('✅ Venda confirmada');
  
  return response as ConfirmacaoResponse;
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