// app/api/payments/pagarme/check/route.ts
import { NextRequest, NextResponse } from 'next/server';

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