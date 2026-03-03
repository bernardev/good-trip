// apps/web/src/lib/estorno.ts
import { kv } from '@vercel/kv';

const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY || '';
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

const getAuthHeader = (): string => {
  const auth = Buffer.from(`${PAGARME_SECRET_KEY}:`).toString('base64');
  return `Basic ${auth}`;
};

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
  servico?: string;
  origem?: string;
  destino?: string;
  data?: string;
  assentos: string[];
  passageiros: Passageiro[];
  preco: number; // 🔥 IMPORTANTE: Este é o valor TOTAL de todos os assentos, não por assento
  chargeId?: string;
  metadata?: Record<string, unknown>;
};

type EstornoStatus = 'PROCESSANDO' | 'CONCLUIDO' | 'FALHOU';

type EstornoLog = {
  status: EstornoStatus;
  timestamp: string;
  orderId: string;
  chargeId?: string;
  valorOriginal: number;
  bilhetesEsperados: number;
  bilhetesEmitidos: number;
  valorEstornado: number;
  motivo: string;
  erro?: string;
  resultado?: PagarmeRefundResponse;
};

type PagarmeRefundResponse = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
};

type EstornoResult = {
  success: boolean;
  estornado: boolean;
  valorEstornado?: number;
  motivo?: string;
  error?: string;
};

type EstornoKVData = {
  status: string;
  timestamp: string;
  motivo?: string;
  valorEstorno?: number;
  resultado?: PagarmeRefundResponse;
};


/**
 * Estorna automaticamente um pedido quando a emissão de bilhetes falha
 * @param orderId - ID do pedido no Pagar.me
 * @param bilhetesEmitidos - Quantidade de bilhetes que foram emitidos com sucesso
 * @param motivo - Motivo do estorno
 * @returns Resultado do estorno
 */
export async function estornarAutomatico(
  orderId: string,
  bilhetesEmitidos: number,
  motivo: string
): Promise<EstornoResult> {
  try {
    console.log(`🔄 Iniciando estorno automático para pedido ${orderId}`);

    // 1️⃣ BUSCAR dados originais da reserva
    const reservaData = await buscarDadosReserva(orderId);
    
    if (!reservaData) {
      console.error('❌ Reserva não encontrada no KV:', orderId);
      return { success: false, estornado: false, error: 'Reserva não encontrada' };
    }

    // 2️⃣ VALIDAR se já foi estornado (proteção contra duplicata)
    const jaEstornado = await verificarSeJaEstornado(orderId);
    
    if (jaEstornado) {
      console.log('⚠️ Pedido já foi estornado anteriormente:', orderId);
      return { success: false, estornado: false, error: 'Já estornado anteriormente' };
    }

    // 3️⃣ CALCULAR valor do estorno (CORRETO)
    // 🔥 reservaData.preco JÁ É O VALOR TOTAL de todos os assentos
    const valorOriginal = reservaData.preco;
    const totalAssentos = reservaData.assentos.length;
    const valorPorAssento = valorOriginal / totalAssentos;
    const assentosNaoEmitidos = totalAssentos - bilhetesEmitidos;
    const valorEstorno = valorPorAssento * assentosNaoEmitidos;

    console.log('💰 Cálculo do estorno:', {
      valorOriginal: valorOriginal.toFixed(2),
      valorPorAssento: valorPorAssento.toFixed(2),
      assentosTotal: totalAssentos,
      bilhetesEmitidos,
      assentosNaoEmitidos,
      valorEstorno: valorEstorno.toFixed(2)
    });

    // 4️⃣ VALIDAR lógica de negócio
    if (valorEstorno > valorOriginal) {
      const erro = 'Valor de estorno maior que pagamento original!';
      console.error('❌', erro);
      await salvarLogEstorno(orderId, reservaData, bilhetesEmitidos, 0, motivo, 'FALHOU', erro);
      return { success: false, estornado: false, error: erro };
    }

    if (valorEstorno <= 0) {
      console.log('✅ Todos os bilhetes foram emitidos, nenhum estorno necessário');
      return { success: true, estornado: false, motivo: 'Todos os bilhetes emitidos' };
    }

    // 5️⃣ MARCAR como processando (evita duplicata)
    const dadosProcessando: EstornoKVData = {
      status: 'PROCESSANDO',
      timestamp: new Date().toISOString(),
      motivo,
      valorEstorno
    };

    await kv.set(`estorno:${orderId}`, dadosProcessando, { ex: 86400 }); // 24 horas

    // 6️⃣ VALIDAR chargeId
    if (!reservaData.chargeId) {
      const erro = 'chargeId não encontrado nos dados da reserva';
      console.error('❌', erro);
      await salvarLogEstorno(orderId, reservaData, bilhetesEmitidos, valorEstorno, motivo, 'FALHOU', erro);
      return { success: false, estornado: false, error: erro };
    }

    // 7️⃣ CHAMAR API Pagar.me para estornar
    const resultado = await estornarPagarme(reservaData.chargeId, valorEstorno);

    if (!resultado) {
      const erro = 'Falha ao processar estorno na Pagar.me';
      await salvarLogEstorno(orderId, reservaData, bilhetesEmitidos, valorEstorno, motivo, 'FALHOU', erro);
      return { success: false, estornado: false, error: erro };
    }

    // 8️⃣ ATUALIZAR status como concluído
    const dadosConcluido: EstornoKVData = {
      status: 'CONCLUIDO',
      timestamp: new Date().toISOString(),
      resultado
    };

    await kv.set(`estorno:${orderId}`, dadosConcluido, { ex: 2592000 }); // 30 dias

    // 9️⃣ SALVAR log completo
    await salvarLogEstorno(orderId, reservaData, bilhetesEmitidos, valorEstorno, motivo, 'CONCLUIDO', undefined, resultado);

    console.log('✅ Estorno processado com sucesso:', {
      orderId,
      valorEstornado: valorEstorno.toFixed(2),
      refundId: resultado.id
    });

    return {
      success: true,
      estornado: true,
      valorEstornado: valorEstorno,
      motivo
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao processar estorno automático:', errorMessage);
    
    return {
      success: false,
      estornado: false,
      error: errorMessage
    };
  }
}

/**
 * Busca dados da reserva no KV
 */
async function buscarDadosReserva(orderId: string): Promise<ReservaData | null> {
  try {
    const data = await kv.get(`reserva:${orderId}`);
    if (!data) {
      return null;
    }
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return parsed as ReservaData;
  } catch (error) {
    console.error('❌ Erro ao buscar reserva do KV:', error);
    return null;
  }
}

/**
 * Verifica se o pedido já foi estornado anteriormente
 */
async function verificarSeJaEstornado(orderId: string): Promise<boolean> {
  try {
    const estorno = await kv.get(`estorno:${orderId}`);
    if (!estorno) {
      return false;
    }
    
    const estornoData = typeof estorno === 'string' ? JSON.parse(estorno) : estorno;
    const typedData = estornoData as EstornoKVData;
    return typedData.status === 'CONCLUIDO' || typedData.status === 'PROCESSANDO';
  } catch (error) {
    console.error('❌ Erro ao verificar estorno:', error);
    return false;
  }
}

/**
 * Chama API Pagar.me para processar o estorno
 */
async function estornarPagarme(
  chargeId: string,
  valorReais: number
): Promise<PagarmeRefundResponse | null> {
  try {
    const url = `${PAGARME_API_URL}/charges/${chargeId}/refund`;
    
    // Converter para centavos (Pagar.me trabalha com centavos)
    const amountCentavos = Math.round(valorReais * 100);
    
    const payload = {
      amount: amountCentavos
    };

    console.log('📤 Enviando estorno para Pagar.me:', {
      chargeId,
      valorReais: valorReais.toFixed(2),
      valorCentavos: amountCentavos
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      console.error('❌ Erro da API Pagar.me:', errorData);
      return null;
    }

    const result: unknown = await response.json();
    console.log('✅ Estorno processado na Pagar.me:', result);
    
    return result as PagarmeRefundResponse;
  } catch (error) {
    console.error('❌ Erro ao chamar API Pagar.me:', error);
    return null;
  }
}

/**
 * Salva log completo do estorno para auditoria
 */
async function salvarLogEstorno(
  orderId: string,
  reservaData: ReservaData,
  bilhetesEmitidos: number,
  valorEstornado: number,
  motivo: string,
  status: EstornoStatus,
  erro?: string,
  resultado?: PagarmeRefundResponse
): Promise<void> {
  try {
    const log: EstornoLog = {
      status,
      timestamp: new Date().toISOString(),
      orderId,
      chargeId: reservaData.chargeId,
      valorOriginal: reservaData.preco, // 🔥 CORRETO: preco já é o total
      bilhetesEsperados: reservaData.assentos.length,
      bilhetesEmitidos,
      valorEstornado,
      motivo,
      erro,
      resultado
    };

    await kv.set(`log:estorno:${orderId}`, log, { ex: 2592000 }); // 30 dias
    console.log('📝 Log de estorno salvo:', orderId);
  } catch (error) {
    console.error('❌ Erro ao salvar log de estorno:', error);
  }
}

/**
 * Conta quantos estornos foram processados hoje (proteção adicional)
 */
export async function contarEstornosHoje(): Promise<number> {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const contador = await kv.get(`estornos-contador:${hoje}`);
    return contador ? Number(contador) : 0;
  } catch (error) {
    console.error('❌ Erro ao contar estornos:', error);
    return 0;
  }
}

/**
 * Incrementa contador de estornos do dia
 */
export async function incrementarContadorEstornos(): Promise<void> {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const contador = await contarEstornosHoje();
    await kv.set(`estornos-contador:${hoje}`, contador + 1, { ex: 86400 }); // 24 horas
  } catch (error) {
    console.error('❌ Erro ao incrementar contador:', error);
  }
}