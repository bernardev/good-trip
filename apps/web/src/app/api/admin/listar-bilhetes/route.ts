// apps/web/src/app/api/admin/listar-bilhetes/route.ts
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

type BilheteCache = {
  localizador: string;
  numeroBilhete: string;
  origemNome: string;
  destinoNome: string;
  dataFormatada: string;
  data: string; // ISO date
  horarioSaida: string;
  assentos: string[];
  passageiro: {
    nome: string;
    email: string;
    documento?: string;
  };
  passageiros?: Array<{
    nomeCompleto: string;
    telefone: string;
    email?: string;
    assento: string;
  }>;
  total: number;
  status: string;
};

type BilheteResumido = {
  orderId: string;
  localizador: string;
  numeroBilhete: string;
  passageiroNome: string;
  telefone: string;
  email: string;
  origem: string;
  destino: string;
  data: string;
  dataEmissao: string; // quando foi emitido
  timestampEmissao: number; // para ordenação
  assentos: string[];
  valor: number;
};

export async function GET() {
  try {
    console.log('Listando bilhetes do cache KV...');

    // Listar todas as chaves que começam com "bilhete:"
    const keys = await kv.keys('bilhete:*');

    if (!keys || keys.length === 0) {
      console.log('Nenhum bilhete encontrado no cache');
      return NextResponse.json({
        success: true,
        bilhetes: [],
        total: 0
      });
    }

    console.log(`Encontradas ${keys.length} chaves de bilhetes`);

    // Buscar dados de cada bilhete com TTL
    const bilhetesPromises = keys.map(async (key) => {
      try {
        // Buscar dados e TTL
        const [data, ttl] = await Promise.all([
          kv.get(key),
          kv.ttl(key) // Tempo restante em segundos
        ]);
        
        if (!data) return null;

        const bilhete = typeof data === 'string' 
          ? JSON.parse(data) 
          : data as BilheteCache;

        // Extrair orderId da chave (formato: "bilhete:ORDER_ID")
        const orderId = key.replace('bilhete:', '');

        // Pegar telefone do primeiro passageiro
        const telefone = bilhete.passageiros?.[0]?.telefone || 
                        bilhete.passageiro?.documento || 
                        'Não informado';

        // Pegar email
        const email = bilhete.passageiros?.[0]?.email || 
                     bilhete.passageiro?.email || 
                     'Não informado';

        // Calcular timestamp de emissão baseado no TTL
        // TTL máximo é 30 dias (2592000 segundos)
        const ttlMaximo = 2592000;
        const segundosPassados = ttlMaximo - (ttl || 0);
        const timestampEmissao = Date.now() - (segundosPassados * 1000);
        const dataEmissao = new Date(timestampEmissao).toISOString();

        const resumido: BilheteResumido = {
          orderId,
          localizador: bilhete.localizador || '',
          numeroBilhete: bilhete.numeroBilhete || '',
          passageiroNome: bilhete.passageiro?.nome || 'Não informado',
          telefone,
          email,
          origem: bilhete.origemNome || '',
          destino: bilhete.destinoNome || '',
          data: bilhete.dataFormatada || '',
          dataEmissao,
          timestampEmissao,
          assentos: bilhete.assentos || [],
          valor: bilhete.total || 0,
        };

        return resumido;
      } catch (error) {
        console.error(`Erro ao processar bilhete ${key}:`, error);
        return null;
      }
    });

    const bilhetes = (await Promise.all(bilhetesPromises))
      .filter((b): b is BilheteResumido => b !== null);

    // 🔥 Ordenar por timestamp de emissão (mais recentes primeiro)
    bilhetes.sort((a, b) => b.timestampEmissao - a.timestampEmissao);

    console.log(`${bilhetes.length} bilhetes processados e ordenados por data de emissão`);

    return NextResponse.json({
      success: true,
      bilhetes,
      total: bilhetes.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar bilhetes:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao listar bilhetes',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}