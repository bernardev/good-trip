// apps/web/src/app/api/viop/conexao/route.ts
import { NextRequest, NextResponse } from 'next/server';

const VIOP_BASE = "https://apiouroprata.rjconsultores.com.br/api-gateway";
const TENANT = "36906f34-b731-46bc-a19d-a6d8923ac2e7";
const AUTH = "Basic R09PRFRSSVBBUEk6QGcxdDIj";

type ConexaoTrecho = {
  servico: string;
  origem: string;
  destino: string;
  origemDescricao: string;
  destinoDescricao: string;
  horaSaida: string;
  horaChegada: string;
  dataSaida: string;
  dataChegada: string;
  preco: number;
  precoOriginal: number;
  classe: string;
  empresa: string;
  empresaId: number;
  poltronasLivres: number;
  poltronasTotal: number;
  sequencia: number;
};

type ConexaoData = {
  temConexao: boolean;
  localidadeConexao: string;
  localidadeConexaoId: number;
  tempoEspera: number;
  trechos: ConexaoTrecho[];
  numeroTrechos: number;
  precoTotal: number;
  duracaoTotal: number;
};

type ApiResponse = {
  ok: boolean;
  conexao?: ConexaoData;
  error?: string;
};

export const dynamic = 'force-dynamic';

/**
 * Calcula diferença em minutos entre dois horários HH:MM
 */
function calcularDiferencaMinutos(horaInicio: string, horaFim: string): number {
  try {
    const [h1, m1] = horaInicio.split(':').map(Number);
    const [h2, m2] = horaFim.split(':').map(Number);
    
    const minutosInicio = h1 * 60 + m1;
    let minutosFim = h2 * 60 + m2;
    
    // Se horário de fim é menor, passou da meia-noite (adiciona 24h)
    if (minutosFim < minutosInicio) {
      minutosFim += 24 * 60;
    }
    
    return minutosFim - minutosInicio;
  } catch {
    return 0;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const servico = searchParams.get('servico');
    const origemId = searchParams.get('origemId');
    const destinoId = searchParams.get('destinoId');
    const data = searchParams.get('data');

    console.log('🔍 [API Conexao] Params:', { servico, origemId, destinoId, data });

    // Validação
    if (!servico || !origemId || !destinoId || !data) {
      return NextResponse.json(
        { ok: false, error: 'Parâmetros obrigatórios: servico, origemId, destinoId, data' },
        { status: 400 }
      );
    }

    // 🔥 Buscar corridas para pegar dados da conexão
    const url = `${VIOP_BASE}/consultacorrida/buscaCorrida`;
    
    const payload = {
      origem: parseInt(origemId),
      destino: parseInt(destinoId),
      data: data,
      volta: false,
    };

    console.log('📤 [API Conexao] Chamando VIOP:', payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-tenant-id': TENANT,
        'authorization': AUTH,
        'user-agent': 'PostmanRuntime/7.49.1',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('❌ [API Conexao] Erro VIOP:', response.status);
      return NextResponse.json(
        { ok: false, error: `Erro na API VIOP: ${response.status}` },
        { status: response.status }
      );
    }

    const data_viop = await response.json();
    console.log('📦 [API Conexao] Resposta VIOP:', JSON.stringify(data_viop, null, 2));

    // Procurar o serviço específico
    const servicos = data_viop.lsServicos || [];
    const servicoEncontrado = servicos.find((s: { servico: string }) => s.servico === servico);

    if (!servicoEncontrado) {
      console.warn('⚠️ [API Conexao] Serviço não encontrado:', servico);
      return NextResponse.json(
        { ok: false, error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se tem conexão
    if (!servicoEncontrado.conexao) {
      console.warn('⚠️ [API Conexao] Serviço sem conexão:', servico);
      return NextResponse.json(
        { ok: false, error: 'Este serviço não possui conexão' },
        { status: 400 }
      );
    }

    // 🔥 Processar dados da conexão
    const conexaoRaw = servicoEncontrado.conexao;

    const trecho1HoraSaida = conexaoRaw.primeiroTrechoHoraSaida || '00:00';
    const trecho1HoraChegada = conexaoRaw.primeiroTrechoHoraChegada || '00:00';
    const trecho2HoraSaida = conexaoRaw.segundoTrechoHoraSaida || '00:00';
    const trecho2HoraChegada = conexaoRaw.segundoTrechoHoraChegada || '00:00';

    // 🔥 CALCULAR durações
    const duracaoTrecho1 = calcularDiferencaMinutos(trecho1HoraSaida, trecho1HoraChegada);
    const duracaoTrecho2 = calcularDiferencaMinutos(trecho2HoraSaida, trecho2HoraChegada);
    const tempoEsperaCalculado = calcularDiferencaMinutos(trecho1HoraChegada, trecho2HoraSaida);
    const duracaoTotalCalculada = duracaoTrecho1 + duracaoTrecho2 + tempoEsperaCalculado;

    console.log('⏱️ [API Conexao] Durações calculadas:', {
      duracaoTrecho1,
      duracaoTrecho2,
      tempoEsperaCalculado,
      duracaoTotalCalculada
    });

    const conexaoData: ConexaoData = {
      temConexao: true,
      localidadeConexao: conexaoRaw.localidadeConexao || 'Conexão',
      localidadeConexaoId: conexaoRaw.localidadeConexaoId || 0,
      tempoEspera: tempoEsperaCalculado,
      trechos: [
        // Trecho 1
        {
          servico: conexaoRaw.primeiroTrechoServico || servico,
          origem: conexaoRaw.primeiroTrechoOrigem?.toString() || origemId,
          destino: conexaoRaw.primeiroTrechoDestino?.toString() || conexaoRaw.localidadeConexaoId?.toString(),
          origemDescricao: conexaoRaw.primeiroTrechoOrigemDescricao || 'Origem',
          destinoDescricao: conexaoRaw.primeiroTrechoDestinoDescricao || conexaoRaw.localidadeConexao,
          horaSaida: conexaoRaw.primeiroTrechoHoraSaida || '00:00',
          horaChegada: conexaoRaw.primeiroTrechoHoraChegada || '00:00',
          dataSaida: data,
          dataChegada: data,
          preco: parseFloat(conexaoRaw.primeiroTrechoPreco || servicoEncontrado.preco || 0),
          precoOriginal: parseFloat(conexaoRaw.primeiroTrechoPrecoOriginal || servicoEncontrado.preco || 0),
          classe: conexaoRaw.primeiroTrechoClasse || servicoEncontrado.classe || 'CONVENCIONAL',
          empresa: conexaoRaw.primeiroTrechoEmpresa || servicoEncontrado.empresaNome || 'Viação',
          empresaId: conexaoRaw.primeiroTrechoEmpresaId || servicoEncontrado.empresaId || 0,
          poltronasLivres: conexaoRaw.primeiroTrechoPoltronasLivres || servicoEncontrado.poltronasLivres || 0,
          poltronasTotal: conexaoRaw.primeiroTrechoPoltronasTotal || servicoEncontrado.poltronasTotal || 0,
          sequencia: 1,
        },
        // Trecho 2
        {
          servico: conexaoRaw.segundoTrechoServico || servico,
          origem: conexaoRaw.segundoTrechoOrigem?.toString() || conexaoRaw.localidadeConexaoId?.toString(),
          destino: conexaoRaw.segundoTrechoDestino?.toString() || destinoId,
          origemDescricao: conexaoRaw.segundoTrechoOrigemDescricao || conexaoRaw.localidadeConexao,
          destinoDescricao: conexaoRaw.segundoTrechoDestinoDescricao || 'Destino',
          horaSaida: conexaoRaw.segundoTrechoHoraSaida || '00:00',
          horaChegada: conexaoRaw.segundoTrechoHoraChegada || '00:00',
          dataSaida: data,
          dataChegada: data,
          preco: parseFloat(conexaoRaw.segundoTrechoPreco || servicoEncontrado.preco || 0),
          precoOriginal: parseFloat(conexaoRaw.segundoTrechoPrecoOriginal || servicoEncontrado.preco || 0),
          classe: conexaoRaw.segundoTrechoClasse || servicoEncontrado.classe || 'CONVENCIONAL',
          empresa: conexaoRaw.segundoTrechoEmpresa || servicoEncontrado.empresaNome || 'Viação',
          empresaId: conexaoRaw.segundoTrechoEmpresaId || servicoEncontrado.empresaId || 0,
          poltronasLivres: conexaoRaw.segundoTrechoPoltronasLivres || servicoEncontrado.poltronasLivres || 0,
          poltronasTotal: conexaoRaw.segundoTrechoPoltronasTotal || servicoEncontrado.poltronasTotal || 0,
          sequencia: 2,
        },
      ],
      numeroTrechos: 2,
      precoTotal: parseFloat(servicoEncontrado.preco || 0),
      duracaoTotal: duracaoTotalCalculada,
    };

    console.log('✅ [API Conexao] Dados processados:', conexaoData);

    return NextResponse.json({
      ok: true,
      conexao: conexaoData,
    } as ApiResponse);

  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ [API Conexao] Erro:', mensagem);
    
    return NextResponse.json(
      { ok: false, error: mensagem },
      { status: 500 }
    );
  }
}