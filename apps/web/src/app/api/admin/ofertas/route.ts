// apps/web/src/app/api/admin/ofertas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const OFERTAS_KEY = 'admin:ofertas';

export type Oferta = {
  id: string;
  origem: string;
  destino: string;
  origemId: string; // ID da API VIOP
  destinoId: string; // ID da API VIOP
  valor: number; // em centavos
  ativo: boolean;
  ordem: number;
};

// GET - Listar todas as ofertas
export async function GET() {
  try {
    const ofertas = await kv.get<Oferta[]>(OFERTAS_KEY) || [];
    
    return NextResponse.json({
      success: true,
      ofertas: ofertas.sort((a, b) => a.ordem - b.ordem)
    });
  } catch (error) {
    console.error('Erro ao listar ofertas:', error);
    return NextResponse.json(
      { error: 'Erro ao listar ofertas' },
      { status: 500 }
    );
  }
}

// POST - Criar nova oferta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origem, destino, origemId, destinoId, valor } = body;

    if (!origem || !destino || !origemId || !destinoId || typeof valor !== 'number') {
      return NextResponse.json(
        { error: 'Campos obrigatórios: origem, destino, origemId, destinoId, valor' },
        { status: 400 }
      );
    }

    const ofertas = await kv.get<Oferta[]>(OFERTAS_KEY) || [];
    
    const novaOferta: Oferta = {
      id: `oferta_${Date.now()}`,
      origem: origem.trim(),
      destino: destino.trim(),
      origemId: origemId.trim(),
      destinoId: destinoId.trim(),
      valor: Math.round(valor * 100), // converter para centavos
      ativo: true,
      ordem: ofertas.length,
    };

    ofertas.push(novaOferta);
    await kv.set(OFERTAS_KEY, ofertas);

    return NextResponse.json({
      success: true,
      oferta: novaOferta
    });
  } catch (error) {
    console.error('Erro ao criar oferta:', error);
    return NextResponse.json(
      { error: 'Erro ao criar oferta' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar oferta
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, origem, destino, origemId, destinoId, valor, ativo, ordem } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const ofertas = await kv.get<Oferta[]>(OFERTAS_KEY) || [];
    const index = ofertas.findIndex(o => o.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Oferta não encontrada' },
        { status: 404 }
      );
    }

    if (origem) ofertas[index].origem = origem.trim();
    if (destino) ofertas[index].destino = destino.trim();
    if (origemId) ofertas[index].origemId = origemId.trim();
    if (destinoId) ofertas[index].destinoId = destinoId.trim();
    if (typeof valor === 'number') ofertas[index].valor = Math.round(valor * 100);
    if (typeof ativo === 'boolean') ofertas[index].ativo = ativo;
    if (typeof ordem === 'number') ofertas[index].ordem = ordem;

    await kv.set(OFERTAS_KEY, ofertas);

    return NextResponse.json({
      success: true,
      oferta: ofertas[index]
    });
  } catch (error) {
    console.error('Erro ao atualizar oferta:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar oferta' },
      { status: 500 }
    );
  }
}

// DELETE - Remover oferta
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const ofertas = await kv.get<Oferta[]>(OFERTAS_KEY) || [];
    const novasOfertas = ofertas.filter(o => o.id !== id);

    if (ofertas.length === novasOfertas.length) {
      return NextResponse.json(
        { error: 'Oferta não encontrada' },
        { status: 404 }
      );
    }

    // Reordenar
    novasOfertas.forEach((o, i) => {
      o.ordem = i;
    });

    await kv.set(OFERTAS_KEY, novasOfertas);

    return NextResponse.json({
      success: true,
      message: 'Oferta removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar oferta:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar oferta' },
      { status: 500 }
    );
  }
}