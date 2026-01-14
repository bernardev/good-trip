// apps/web/src/app/api/reenviar-bilhete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { enviarBilheteLinkWhatsApp } from '@/lib/evolution-whatsapp';

type BilheteData = {
  localizador: string;
  numeroBilhete: string;
  origemNome: string;
  destinoNome: string;
  dataFormatada: string;
  assentos: string[];
  localizadores: string[];
  poltrona?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, telefone, dados } = body;

    if (!telefone) {
      return NextResponse.json({
        success: false,
        message: 'Telefone é obrigatório'
      }, { status: 400 });
    }

    let bilheteData: BilheteData;

    // Se veio orderId, busca do cache
    if (orderId) {
      const cached = await kv.get(`bilhete:${orderId}`);
      if (!cached) {
        return NextResponse.json({
          success: false,
          message: 'Bilhete não encontrado no cache'
        }, { status: 404 });
      }
      bilheteData = typeof cached === 'string' ? JSON.parse(cached) : cached;
    } 
    // Se veio dados direto, usa eles
    else if (dados) {
      bilheteData = dados;
    } 
    else {
      return NextResponse.json({
        success: false,
        message: 'Forneça orderId ou dados do bilhete'
      }, { status: 400 });
    }

    console.log('🔄 Reenviando bilhete:', bilheteData.localizador);

    // Enviar link do bilhete via WhatsApp
    const enviado = await enviarBilheteLinkWhatsApp(
      telefone,
      orderId || 'manual',
      {
        origem: bilheteData.origemNome,
        destino: bilheteData.destinoNome,
        data: bilheteData.dataFormatada,
        assentos: bilheteData.assentos || [bilheteData.poltrona],
        localizadores: bilheteData.localizadores || [bilheteData.localizador]
      }
    );

    if (!enviado) {
      throw new Error('Falha ao enviar WhatsApp');
    }

    return NextResponse.json({
      success: true,
      message: 'Link do bilhete reenviado com sucesso!',
      localizador: bilheteData.localizador
    });

  } catch (error) {
    console.error('❌ Erro ao reenviar bilhete:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao reenviar'
    }, { status: 500 });
  }
}