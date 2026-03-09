// apps/web/src/app/api/minha-passagem/verificar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

type BilheteResumo = {
  orderId: string;
  localizador: string;
  numeroBilhete: string;
  origemNome: string;
  destinoNome: string;
  dataFormatada: string;
  horarioSaida: string;
  empresa: string;
  assentos: string[];
  total: number;
  passageiro: { nome: string; email: string };
};

export async function POST(req: NextRequest) {
  try {
    const { email, codigo } = await req.json();

    if (!email || !codigo) {
      return NextResponse.json({ error: 'Email e código obrigatórios' }, { status: 400 });
    }

    const emailNormalizado = email.toLowerCase().trim();

    // Verificar OTP
    const otpSalvo = await kv.get<string>(`otp:${emailNormalizado}`);

    if (!otpSalvo || otpSalvo !== codigo.toString().trim()) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 401 });
    }

    // OTP válido — buscar bilhetes do cliente
    const orderIds = await kv.get<string[]>(`bilhetes-email:${emailNormalizado}`);

    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json({ success: true, bilhetes: [] });
    }

    // Buscar dados de cada bilhete
    const bilhetes: BilheteResumo[] = [];

    for (const orderId of orderIds) {
      const dados = await kv.get<Record<string, unknown>>(`bilhete:${orderId}`);
      if (dados) {
        bilhetes.push({
          orderId,
          localizador: (dados.localizador as string) || '',
          numeroBilhete: (dados.numeroBilhete as string) || '',
          origemNome: (dados.origemNome as string) || '',
          destinoNome: (dados.destinoNome as string) || '',
          dataFormatada: (dados.dataFormatada as string) || '',
          horarioSaida: (dados.horarioSaida as string) || '',
          empresa: (dados.empresa as string) || '',
          assentos: (dados.assentos as string[]) || [],
          total: (dados.total as number) || 0,
          passageiro: (dados.passageiro as { nome: string; email: string }) || { nome: '', email: '' },
        });
      }
    }

    // Não invalidar o OTP — permitir consultas por 3h
    return NextResponse.json({ success: true, bilhetes });

  } catch (error) {
    console.error('[minha-passagem] Erro ao verificar:', error);
    return NextResponse.json({ error: 'Erro ao verificar código' }, { status: 500 });
  }
}
