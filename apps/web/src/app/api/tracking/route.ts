// apps/web/src/app/api/tracking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { notificarAdmin } from '@/lib/notificacoes-admin';

export const dynamic = 'force-dynamic';

type TrackingBody = {
  evento: string;
  dados?: {
    orderId?: string;
    valor?: number;
    passageiro?: string;
    origem?: string;
    destino?: string;
    data?: string;
    assentos?: string[];
    detalhes?: string;
  };
};

const EVENTOS_PERMITIDOS = [
  'BUSCA_REALIZADA',
  'ASSENTOS_SELECIONADOS',
  'IDENTIFICACAO_CONCLUIDA',
  'PAGINA_PAGAMENTO',
  'PIX_EXPIRADO',
];

export async function POST(req: NextRequest) {
  try {
    const body: TrackingBody = await req.json();
    const { evento, dados } = body;

    if (!evento || !EVENTOS_PERMITIDOS.includes(evento)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Extrair IP do cliente
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    // Fire-and-forget: não bloqueia a resposta
    notificarAdmin({
      tipo: evento as Parameters<typeof notificarAdmin>[0]['tipo'],
      ...dados,
      ip,
    }).catch(console.error);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
