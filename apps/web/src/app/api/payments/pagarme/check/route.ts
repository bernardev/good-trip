// app/api/payments/pagarme/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { estornarAutomatico } from '@/lib/estorno';
import { notificarAdmin } from '@/lib/notificacoes-admin';

const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY || 'sk_test_XXXXX';
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

const getAuthHeader = () => {
  const auth = Buffer.from(`${PAGARME_SECRET_KEY}:`).toString('base64');
  return `Basic ${auth}`;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'order_id é obrigatório'
      }, { status: 400 });
    }

    // ⚠️ VERIFICAR SE TEM A CHAVE SECRETA
    if (!PAGARME_SECRET_KEY || PAGARME_SECRET_KEY === 'sk_test_XXXXX') {
      // Modo de simulação
      console.log('⚠️ MODO SIMULAÇÃO - Verificando pedido:', orderId);

      // Simular que após 30 segundos o pagamento é aprovado
      const isPaid = orderId.startsWith('sim_') && Date.now() - parseInt(orderId.split('_')[1]) > 30000;

      return NextResponse.json({
        success: true,
        order_id: orderId,
        status: isPaid ? 'paid' : 'pending',
        message: isPaid ? 'Pagamento simulado aprovado!' : 'Aguardando pagamento...'
      });
    }

    // Buscar pedido na API Pagar.me
    const response = await fetch(`${PAGARME_API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao buscar pedido:', errorData);

      return NextResponse.json({
        success: false,
        message: 'Erro ao verificar status do pagamento',
        error: errorData
      }, { status: response.status });
    }

    const order = await response.json();
    const charge = order.charges[0];
    const status = charge.status;

    // 🔥 DETECÇÃO SERVER-SIDE: Pagamento confirmado mas sem bilhete → estorno automático
    if (status === 'paid') {
      const bilhete = await kv.get(`bilhete:${orderId}`);
      const jaEstornado = await kv.get(`estorno:${orderId}`);
      const jaProcessado = await kv.get(`check-processado:${orderId}`);

      if (!bilhete && !jaEstornado && !jaProcessado) {
        // Marcar como processado para evitar múltiplos estornos durante polling
        await kv.set(`check-processado:${orderId}`, true, { ex: 3600 }); // TTL 1h

        console.log(`🚨 [CHECK] Pagamento sem bilhete detectado: ${orderId}. Acionando estorno.`);

        const valorCentavos = order.amount || 0;
        const valorReais = valorCentavos / 100;

        // Estorno automático (fire-and-forget para não atrasar a resposta do polling)
        estornarAutomatico(
          orderId,
          0,
          'Pagamento detectado via check sem bilhete emitido — possível saída da página antes da confirmação'
        ).catch(err => {
          console.error('❌ [CHECK] Erro no estorno automático:', err);
        });

        // Notificar admin (fire-and-forget)
        notificarAdmin({
          tipo: 'PAGAMENTO_SEM_BILHETE',
          orderId,
          valor: valorReais,
          detalhes: 'Pagamento confirmado na PagarMe porém nenhum bilhete foi emitido. Estorno automático acionado.',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      status: status,
      amount: order.amount,
      created_at: order.created_at,
      charge_id: charge.id
    });

  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);

    return NextResponse.json({
      success: false,
      message: 'Erro interno ao verificar pagamento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
