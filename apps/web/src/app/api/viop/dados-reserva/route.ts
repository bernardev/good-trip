// apps/web/src/app/api/viop/dados-reserva/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId não fornecido' }, { status: 400 });
    }

    console.log('📋 Buscando dados da reserva:', orderId);

    // Buscar do cache KV
    const bilheteCache = await kv.get(`bilhete:${orderId}`);

    if (!bilheteCache) {
      console.error('❌ Reserva não encontrada no cache:', orderId);
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    const reserva = typeof bilheteCache === 'string' ? JSON.parse(bilheteCache) : bilheteCache;
    console.log('✅ Dados da reserva recuperados');

    // Retornar apenas os dados necessários para a página de agradecimento
    return NextResponse.json({
      localizador: reserva.localizador,
      numeroBilhete: reserva.numeroBilhete,
      total: reserva.total,
      origemNome: reserva.origemNome,
      destinoNome: reserva.destinoNome,
      dataFormatada: reserva.dataFormatada,
      horarioSaida: reserva.horarioSaida,
      empresa: reserva.empresa,
      classe: reserva.classe,
      assentos: reserva.assentos,
      passageiro: reserva.passageiro,
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados da reserva:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar dados da reserva',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}