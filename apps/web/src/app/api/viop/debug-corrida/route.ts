// apps/web/src/app/api/viop/debug-corrida/route.ts
import { NextRequest, NextResponse } from "next/server";

const VIOP_BASE = "https://apiouroprata.rjconsultores.com.br/api-gateway";
const TENANT = "36906f34-b731-46bc-a19d-a6d8923ac2e7";
const AUTH = "Basic R09PRFRSSVBBUEk6QGcxdDIj";

type ViopServico = {
  servico?: string;
  identificadorViagem?: string;
  preco?: number;
  precoOriginal?: number;
  poltronasLivres?: number;
  poltronasTotal?: number;
  classe?: string;
  empresa?: string;
  empresaId?: number;
  tarifa?: number;
  dataCorrida?: string;
  data?: string;
  saida?: string;
  chegada?: string;
  [key: string]: unknown;
};

type BuscaCorridaResponse = {
  lsServicos?: ViopServico[];
  [key: string]: unknown;
};

type DebugRequest = {
  url: string;
  method: string;
  payload: {
    origem: string;
    destino: string;
    data: string;
  };
};

type DebugResponse = {
  status: number;
  statusText: string;
  duration: string;
  data: BuscaCorridaResponse | string;
};

type DebugSuccessResponse = {
  success: true;
  timestamp: string;
  request: DebugRequest;
  response: DebugResponse;
  logs: string[];
  logsFormatted: string;
};

type DebugErrorResponse = {
  success: false;
  timestamp: string;
  error: string;
  logs: string[];
  logsFormatted: string;
};

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const origemId = p.get("origemId");
  const destinoId = p.get("destinoId");
  const data = p.get("data");

  if (!origemId || !destinoId || !data) {
    return NextResponse.json(
      { 
        error: "Parametros obrigatorios: origemId, destinoId, data",
        exemplo: "/api/viop/debug-corrida?origemId=10102&destinoId=10109&data=2026-02-15"
      },
      { status: 400 }
    );
  }

  const logs: string[] = [];
  const timestamp = new Date().toISOString();

  try {
    logs.push(`[${timestamp}] DEBUG - Busca de Corrida VIOP`);
    logs.push(`[${timestamp}] Origem: ${origemId}`);
    logs.push(`[${timestamp}] Destino: ${destinoId}`);
    logs.push(`[${timestamp}] Data: ${data}`);
    logs.push('');

    const payload = {
      origem: origemId,
      destino: destinoId,
      data: data
    };

    logs.push(`[${timestamp}] REQUEST:`);
    logs.push(`URL: ${VIOP_BASE}/consultacorrida/buscaCorrida`);
    logs.push(`Method: POST`);
    logs.push(`Headers:`);
    logs.push(`  - content-type: application/json`);
    logs.push(`  - x-tenant-id: ${TENANT}`);
    logs.push(`  - authorization: Basic R09PRFRSSVBBUEk6QGcxdDIj`);
    logs.push(`Payload: ${JSON.stringify(payload, null, 2)}`);
    logs.push('');

    const startTime = Date.now();
    
    const response = await fetch(`${VIOP_BASE}/consultacorrida/buscaCorrida`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": TENANT,
        "authorization": AUTH,
        "user-agent": "PostmanRuntime/7.49.1"
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    logs.push(`[${timestamp}] RESPONSE:`);
    logs.push(`Status: ${response.status} ${response.statusText}`);
    logs.push(`Tempo de resposta: ${duration}ms`);
    logs.push('');

    const responseText = await response.text();
    
    let responseData: BuscaCorridaResponse | string;
    try {
      responseData = JSON.parse(responseText) as BuscaCorridaResponse;
      logs.push(`[${timestamp}] JSON Valido`);
    } catch {
      logs.push(`[${timestamp}] ERRO: Resposta nao e JSON valido`);
      responseData = responseText;
    }

    logs.push('');
    logs.push(`[${timestamp}] DADOS COMPLETOS DA RESPOSTA:`);
    logs.push(JSON.stringify(responseData, null, 2));
    logs.push('');

    if (typeof responseData === 'object' && responseData.lsServicos && Array.isArray(responseData.lsServicos)) {
      logs.push(`[${timestamp}] TOTAL DE SERVICOS: ${responseData.lsServicos.length}`);
      logs.push('');
      
      responseData.lsServicos.forEach((servico: ViopServico, index: number) => {
        logs.push(`[${timestamp}] SERVICO #${index + 1}:`);
        logs.push(`  - servico: ${servico.servico || 'N/A'}`);
        logs.push(`  - data (buscada): ${servico.data || 'N/A'}`);
        logs.push(`  - dataCorrida (real): ${servico.dataCorrida || 'N/A'}`);
        logs.push(`  - saida: ${servico.saida || 'N/A'}`);
        logs.push(`  - chegada: ${servico.chegada || 'N/A'}`);
        logs.push(`  - preco: R$ ${servico.preco || 'N/A'}`);
        logs.push(`  - classe: ${servico.classe || 'N/A'}`);
        logs.push(`  - empresa: ${servico.empresa || 'N/A'}`);
        logs.push(`  - poltronasLivres: ${servico.poltronasLivres || 'N/A'}`);
        
        if (servico.data && servico.dataCorrida && servico.data !== servico.dataCorrida) {
          logs.push(`  ATENCAO: Data buscada (${servico.data}) diferente de Data real (${servico.dataCorrida})`);
        }
        
        logs.push('');
      });
    } else {
      logs.push(`[${timestamp}] Nenhum servico encontrado ou estrutura invalida`);
    }

    logs.push(`[${timestamp}] RESUMO:`);
    logs.push(`Request enviado com sucesso`);
    logs.push(`Response recebido em ${duration}ms`);
    logs.push(`Status HTTP: ${response.status}`);
    
    if (typeof responseData === 'object' && responseData.lsServicos) {
      logs.push(`Total de servicos: ${responseData.lsServicos.length}`);
    }

    const successResponse: DebugSuccessResponse = {
      success: true,
      timestamp,
      request: {
        url: `${VIOP_BASE}/consultacorrida/buscaCorrida`,
        method: "POST",
        payload
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        data: responseData
      },
      logs: logs,
      logsFormatted: logs.join('\n')
    };

    return NextResponse.json(successResponse, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    logs.push('');
    logs.push(`[${timestamp}] ERRO:`);
    logs.push(errorMessage);
    
    if (error instanceof Error && error.stack) {
      logs.push('');
      logs.push(`[${timestamp}] STACK TRACE:`);
      logs.push(error.stack);
    }

    const errorResponse: DebugErrorResponse = {
      success: false,
      timestamp,
      error: errorMessage,
      logs: logs,
      logsFormatted: logs.join('\n')
    };

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }
}