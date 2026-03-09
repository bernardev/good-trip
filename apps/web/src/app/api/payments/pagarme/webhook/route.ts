// apps/web/src/app/api/payments/pagarme/webhook/route.ts
// Webhook PagarMe — rede de segurança para pagamentos PIX não detectados pelo polling
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { estornarAutomatico } from '@/lib/estorno';
import { notificarAdmin } from '@/lib/notificacoes-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('[PagarMe][WEBHOOK] Recebido:', JSON.stringify(body));

    // PagarMe envia: { id, account, type, data: { id, ... charges: [...] } }
    const eventType = body.type;
    const orderData = body.data;

    if (!orderData) {
      return NextResponse.json({ ok: true, message: 'Sem dados' });
    }

    const orderId = orderData.id;
    const charge = orderData.charges?.[0];
    const chargeStatus = charge?.status;

    // Só processar eventos de pagamento confirmado
    if (eventType !== 'order.paid' && chargeStatus !== 'paid') {
      console.log('[PagarMe][WEBHOOK] Evento ignorado:', eventType, chargeStatus);
      return NextResponse.json({ ok: true, message: 'Evento ignorado' });
    }

    console.log('[PagarMe][WEBHOOK] Pagamento confirmado:', orderId);

    // Verificar se já tem bilhete emitido (evitar duplicata)
    const bilheteExistente = await kv.get(`bilhete:${orderId}`);

    if (bilheteExistente) {
      console.log('[PagarMe][WEBHOOK] Bilhete já emitido para:', orderId);
      return NextResponse.json({ ok: true, message: 'Bilhete já emitido' });
    }

    // Verificar se já foi estornado
    const estornoExistente = await kv.get(`estorno:${orderId}`);
    if (estornoExistente) {
      console.log('[PagarMe][WEBHOOK] Estorno já processado para:', orderId);
      return NextResponse.json({ ok: true, message: 'Estorno já processado' });
    }

    // Pagamento confirmado mas sem bilhete → estornar automaticamente
    console.log('[PagarMe][WEBHOOK] Pagamento sem bilhete — iniciando estorno:', orderId);

    const resultadoEstorno = await estornarAutomatico(
      orderId,
      0, // nenhum bilhete emitido
      'Pagamento recebido via webhook após expiração do PIX — estorno automático'
    );

    const valorAmount = orderData.amount ? (orderData.amount / 100) : undefined;

    if (resultadoEstorno.success && resultadoEstorno.estornado) {
      // Notificar admin sobre estorno via webhook
      notificarAdmin({
        tipo: 'PAGAMENTO_WEBHOOK',
        orderId,
        valor: valorAmount,
        detalhes: 'Pagamento detectado via webhook após expiração do PIX. Bilhete não havia sido emitido.',
        motivo: `✅ Estorno automático processado: R$ ${resultadoEstorno.valorEstornado?.toFixed(2)}`,
      }).catch(console.error);

      console.log('[PagarMe][WEBHOOK] Estorno processado com sucesso:', orderId);
    } else {
      // Estorno falhou — notificar admin para ação manual
      notificarAdmin({
        tipo: 'PAGAMENTO_WEBHOOK',
        orderId,
        valor: valorAmount,
        detalhes: 'Pagamento detectado via webhook após expiração do PIX. Bilhete não havia sido emitido.',
        motivo: `🚨 ESTORNO FALHOU: ${resultadoEstorno.error || 'Erro desconhecido'} — AÇÃO MANUAL NECESSÁRIA!`,
      }).catch(console.error);

      console.error('[PagarMe][WEBHOOK] Estorno falhou:', orderId, resultadoEstorno.error);
    }

    return NextResponse.json({ ok: true, message: 'Webhook processado' });

  } catch (error) {
    console.error('[PagarMe][WEBHOOK] Erro:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
