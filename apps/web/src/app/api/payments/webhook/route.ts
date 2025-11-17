import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook de notificação do Mercado Pago (testes)
 * Em produção, valide assinatura (x-signature) e consulte o Payment/merchant_order.
 */
export async function POST(req: NextRequest) {
  try {
    const topic = req.nextUrl.searchParams.get('type') ?? req.nextUrl.searchParams.get('topic');
    const id = req.nextUrl.searchParams.get('id') ?? req.nextUrl.searchParams.get('data.id');
    const body = await req.json().catch(() => ({}));

    // Log mínimo para inspecionar no dev
    // eslint-disable-next-line no-console
    console.log('[MP][WEBHOOK] topic:', topic, 'id:', id, 'body:', JSON.stringify(body));

    // Responder 200 informa ao MP que recebemos
    return NextResponse.json({ ok: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[MP][WEBHOOK] erro:', e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
