// apps/web/src/app/api/viop/reenviar-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { enviarEmailBilheteAdmin } from '@/lib/enviar-email-bilhete';

type BilheteCache = {
  localizador: string;
  numeroBilhete: string;
  origemNome: string;
  destinoNome: string;
  dataFormatada: string;
  horarioSaida: string;
  assentos: string[];
  passageiro: {
    nome: string;
    email: string;
  };
  total: number;
};

async function gerarPDFBilhete(orderId: string): Promise<Buffer | null> {
  try {
    console.log('📄 Gerando PDF do bilhete para reenvio...');
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/viop/gerar-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
      console.error('❌ Erro ao gerar PDF:', response.status);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID é obrigatório' },
        { status: 400 }
      );
    }

    console.log('📧 Iniciando reenvio de email para:', orderId);

    // Buscar dados do bilhete no cache
    const bilheteCache = await kv.get(`bilhete:${orderId}`);

    if (!bilheteCache) {
      console.error('❌ Bilhete não encontrado no cache:', orderId);
      return NextResponse.json(
        { error: 'Bilhete não encontrado' },
        { status: 404 }
      );
    }

    const bilhete = typeof bilheteCache === 'string' 
      ? JSON.parse(bilheteCache) 
      : bilheteCache as BilheteCache;

    console.log('✅ Dados do bilhete encontrados:', {
      localizador: bilhete.localizador,
      passageiro: bilhete.passageiro?.nome
    });

    // Gerar PDF
    const pdfBuffer = await gerarPDFBilhete(orderId);

    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'Não foi possível gerar o PDF do bilhete' },
        { status: 500 }
      );
    }

    console.log('✅ PDF gerado com sucesso');

    // Enviar email
    const resultado = await enviarEmailBilheteAdmin(pdfBuffer, {
      localizador: bilhete.localizador || '',
      numeroBilhete: bilhete.numeroBilhete || '',
      origem: bilhete.origemNome || '',
      destino: bilhete.destinoNome || '',
      data: bilhete.dataFormatada || '',
      horario: bilhete.horarioSaida || '',
      assentos: bilhete.assentos || [],
      passageiro: bilhete.passageiro?.nome || '',
      emailCliente: bilhete.passageiro?.email || '',
      valor: bilhete.total || 0,
    });

    if (!resultado.sucesso) {
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao enviar email' },
        { status: 500 }
      );
    }

    console.log('✅ Email reenviado com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Email reenviado com sucesso!',
      localizador: bilhete.localizador,
    });

  } catch (error) {
    console.error('❌ Erro ao reenviar email:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao reenviar email',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}