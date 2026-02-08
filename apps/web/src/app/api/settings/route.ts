// apps/web/src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const OFERTAS_KEY = 'admin:ofertas';

type Oferta = {
  id: string;
  origem: string;
  destino: string;
  origemId: string;
  destinoId: string;
  valor: number;
  ativo: boolean;
  ordem: number;
};

export async function GET() {
  try {
    const ofertas = await kv.get<Oferta[]>(OFERTAS_KEY) || [];
    
    const ofertsAtivas = ofertas
      .filter(o => o.ativo)
      .sort((a, b) => a.ordem - b.ordem)
      .map(o => ({
        id: o.id,
        from: o.origem,
        to: o.destino,
        fromId: o.origemId, // ID para link
        toId: o.destinoId, // ID para link
        priceCents: o.valor,
        active: o.ativo,
        order: o.ordem,
      }));

    return NextResponse.json({
      offers: ofertsAtivas
    });
  } catch (error) {
    console.error('Erro ao buscar settings:', error);
    return NextResponse.json(
      { offers: [] },
      { status: 200 }
    );
  }
}