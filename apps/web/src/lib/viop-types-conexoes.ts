// apps/web/src/lib/viop-types-conexoes.ts

/**
 * Tipos para viagens com CONEXÃO (baldeação)
 * Baseado na estrutura da API VIOP
 */

export interface ConexaoTrecho {
  // Identificação
  servico: string;                    // ID do serviço do trecho
  
  // Localidades
  origem: number;
  origemDescricao: string;
  destino: number;
  destinoDescricao: string;
  
  // Horários
  horaSaida: string;                  // "HH:MM"
  horaChegada: string;                // "HH:MM"
  
  // Valores
  preco: string;                      // valor em string (ex: "80.00")
  
  // Disponibilidade
  poltronasLivres: number;
  
  // Empresa
  empresa: string;
  
  // Tempo de espera (apenas para o segundo trecho)
  tempoEspera?: number;               // em minutos
}

export interface ConexaoData {
  // Localidade da conexão (onde ocorre a baldeação)
  localidadeConexao: string;
  localidadeConexaoId: number;
  
  // Primeiro trecho
  primeiroTrechoServico: string;
  primeiroTrechoOrigem: number;
  primeiroTrechoOrigemDescricao: string;
  primeiroTrechoDestino: number;
  primeiroTrechoDestinoDescricao: string;
  primeiroTrechoHoraSaida: string;
  primeiroTrechoHoraChegada: string;
  primeiroTrechoPreco: string;
  primeiroTrechoPoltronasLivres: number;
  primeiroTrechoEmpresa: string;
  
  // Segundo trecho
  segundoTrechoServico: string;
  segundoTrechoOrigem: number;
  segundoTrechoOrigemDescricao: string;
  segundoTrechoDestino: number;
  segundoTrechoDestinoDescricao: string;
  segundoTrechoHoraSaida: string;
  segundoTrechoHoraChegada: string;
  segundoTrechoPreco: string;
  segundoTrechoPoltronasLivres: number;
  segundoTrechoEmpresa: string;
  segundoTrechoTempoEspera: string | number;  // 🔥 Pode ser "HH:MM" ou minutos
}

/**
 * Estrutura normalizada para usar no adapter
 */
export interface ConexaoNormalizada {
  localidadeConexao: string;
  localidadeConexaoId: number;
  
  trechos: [ConexaoTrecho, ConexaoTrecho];
  
  // Dados calculados
  duracaoTotal: number;              // em minutos (trecho1 + espera + trecho2)
  precoTotal: number;                // soma dos dois trechos
  tempoEspera: number;               // em minutos
  
  // Menor número de assentos disponíveis entre os trechos
  assentosDisponiveis: number;
}

/**
 * Helper para normalizar conexão da API
 */
export function normalizarConexao(conexao: ConexaoData): ConexaoNormalizada {
  const primeiroTrecho: ConexaoTrecho = {
    servico: conexao.primeiroTrechoServico,
    origem: conexao.primeiroTrechoOrigem,
    origemDescricao: conexao.primeiroTrechoOrigemDescricao,
    destino: conexao.primeiroTrechoDestino,
    destinoDescricao: conexao.primeiroTrechoDestinoDescricao,
    horaSaida: conexao.primeiroTrechoHoraSaida,
    horaChegada: conexao.primeiroTrechoHoraChegada,
    preco: conexao.primeiroTrechoPreco,
    poltronasLivres: conexao.primeiroTrechoPoltronasLivres,
    empresa: conexao.primeiroTrechoEmpresa,
  };
  
  const segundoTrecho: ConexaoTrecho = {
    servico: conexao.segundoTrechoServico,
    origem: conexao.segundoTrechoOrigem,
    origemDescricao: conexao.segundoTrechoOrigemDescricao,
    destino: conexao.segundoTrechoDestino,
    destinoDescricao: conexao.segundoTrechoDestinoDescricao,
    horaSaida: conexao.segundoTrechoHoraSaida,
    horaChegada: conexao.segundoTrechoHoraChegada,
    preco: conexao.segundoTrechoPreco,
    poltronasLivres: conexao.segundoTrechoPoltronasLivres,
    empresa: conexao.segundoTrechoEmpresa,
  };
  
  // Calcular duração do primeiro trecho
  const duracao1 = calcularDuracaoMinutos(
    primeiroTrecho.horaSaida,
    primeiroTrecho.horaChegada
  );
  
  // Calcular duração do segundo trecho
  const duracao2 = calcularDuracaoMinutos(
    segundoTrecho.horaSaida,
    segundoTrecho.horaChegada
  );
  
  // 🔥 Converter tempo de espera (pode ser "HH:MM" ou número)
  const tempoEspera = converterTempoEspera(conexao.segundoTrechoTempoEspera);
  
  const duracaoTotal = duracao1 + tempoEspera + duracao2;
  
  const preco1 = parseFloat(conexao.primeiroTrechoPreco) || 0;
  const preco2 = parseFloat(conexao.segundoTrechoPreco) || 0;
  const precoTotal = preco1 + preco2;
  
  const assentosDisponiveis = Math.min(
    conexao.primeiroTrechoPoltronasLivres,
    conexao.segundoTrechoPoltronasLivres
  );
  
  return {
    localidadeConexao: conexao.localidadeConexao,
    localidadeConexaoId: conexao.localidadeConexaoId,
    trechos: [primeiroTrecho, segundoTrecho],
    duracaoTotal,
    precoTotal,
    tempoEspera,
    assentosDisponiveis,
  };
}

/**
 * 🔥 NOVO: Converte tempo de espera de "HH:MM" ou número para minutos
 */
function converterTempoEspera(tempoEspera: string | number): number {
  // Se já é número, retorna
  if (typeof tempoEspera === 'number') {
    return tempoEspera;
  }
  
  // Se é string no formato "HH:MM"
  if (typeof tempoEspera === 'string' && tempoEspera.includes(':')) {
    const [horas, minutos] = tempoEspera.split(':').map(Number);
    return (horas * 60) + minutos;
  }
  
  // Fallback: tentar converter string para número
  const num = parseInt(String(tempoEspera), 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Calcula duração em minutos entre dois horários HH:MM
 */
function calcularDuracaoMinutos(inicio: string, fim: string): number {
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fim.split(':').map(Number);
  
  let minutos = (h2 * 60 + m2) - (h1 * 60 + m1);
  
  // Se negativo, passou da meia-noite
  if (minutos < 0) {
    minutos += 24 * 60;
  }
  
  return minutos;
}

/**
 * Formata tempo de espera para exibição
 */
export function formatarTempoEspera(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  if (horas === 0) {
    return `${mins}min`;
  }
  
  if (mins === 0) {
    return `${horas}h`;
  }
  
  return `${horas}h ${mins}min`;
}