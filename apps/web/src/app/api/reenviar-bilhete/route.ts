// apps/web/src/app/api/reenviar-bilhete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { gerarBilhetePDF } from '@/lib/bilhete-pdf';
import { enviarBilhetePDFWhatsApp } from '@/lib/evolution-whatsapp';

type BilheteData = {
  localizador: string;
  numeroBilhete: string;
  origemNome: string;
  destinoNome: string;
  dataFormatada: string;
  horarioSaida: string;
  horarioChegada: string;
  assentos: string[];
  classe: string;
  empresa: string;
  total: number;
  tarifa: number;
  pedagio: number;
  taxaEmbarque: number;
  seguro: number;
  outros: number;
  poltrona?: string;
  passageiro: {
    nome: string;
    documento: string;
  };
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

    // Para cada assento
    const assentos = bilheteData.assentos || [bilheteData.poltrona];
    
    for (let i = 0; i < assentos.length; i++) {
      const assento = assentos[i];
      
      const pdfBuffer = await gerarBilhetePDF({
        localizador: bilheteData.localizador,
        numeroBilhete: bilheteData.numeroBilhete,
        passageiro: {
          nome: bilheteData.passageiro.nome,
          documento: bilheteData.passageiro.documento
        },
        origemNome: bilheteData.origemNome,
        destinoNome: bilheteData.destinoNome,
        dataFormatada: bilheteData.dataFormatada,
        horarioSaida: bilheteData.horarioSaida,
        horarioChegada: bilheteData.horarioChegada,
        assento: assento,
        classe: bilheteData.classe,
        empresa: bilheteData.empresa,
        total: bilheteData.total / assentos.length,
        tarifa: bilheteData.tarifa || 0,
        pedagio: bilheteData.pedagio || 0,
        taxaEmbarque: bilheteData.taxaEmbarque || 0,
        seguro: bilheteData.seguro || 0,
        outros: bilheteData.outros || 0
      });

      const nomeArquivo = `Bilhete-GoodTrip-${bilheteData.localizador}.pdf`;
      const caption = `🎫 Seu bilhete Good Trip\n\n` +
                    `✈️ ${bilheteData.origemNome} → ${bilheteData.destinoNome}\n` +
                    `📅 ${bilheteData.dataFormatada}\n` +
                    `💺 Assento ${assento}\n` +
                    `🔢 Localizador: ${bilheteData.localizador}\n\n` +
                    `Boa viagem! 🚌`;

      const enviado = await enviarBilhetePDFWhatsApp(
        telefone,
        pdfBuffer,
        nomeArquivo,
        caption
      );

      if (!enviado) {
        throw new Error('Falha ao enviar WhatsApp');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bilhete reenviado com sucesso!',
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