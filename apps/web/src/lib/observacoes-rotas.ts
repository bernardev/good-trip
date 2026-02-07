// apps/web/src/lib/observacoes-rotas.ts

type ObservacaoRota = {
  texto: string;
  tipo: 'embarque' | 'desembarque' | 'ambos';
  icone?: string;
};

/**
 * Retorna observação específica de embarque/desembarque baseado na rota e horário
 */
export function getObservacaoRota(
  origem: string,
  destino: string,
  horarioSaida: string
): ObservacaoRota | null {
  // Normalizar nomes de cidades (case-insensitive)
  const origemNorm = origem.toUpperCase().trim();
  const destinoNorm = destino.toUpperCase().trim();
  
  // Extrair apenas HH:MM do horário (pode vir como "14:30:00" ou "2025-01-06T14:30:00")
  const horario = horarioSaida.includes('T') 
    ? horarioSaida.split('T')[1].substring(0, 5)
    : horarioSaida.substring(0, 5);

  // ITAITUBA → SANTARÉM
  if (
    (origemNorm.includes('ITAITUBA') && destinoNorm.includes('SANTAREM')) ||
    (origemNorm.includes('ITAITUBA') && destinoNorm.includes('SANTARÉM'))
  ) {
    // Horários que embarcam na RODOVIÁRIA DE ITAITUBA
    if (horario === '06:30' || horario === '14:30' || horario === '22:30') {
      return {
        texto: 'Embarque na Rodoviária de Itaituba',
        tipo: 'embarque',
        icone: '🚏'
      };
    }
    
    // Demais horários embarcam em MIRITITUBA
    return {
      texto: 'Embarque em Miritituba',
      tipo: 'embarque',
      icone: '📍'
    };
  }

  // 🔥 SANTARÉM → ITAITUBA
  if (
    (origemNorm.includes('SANTAREM') && destinoNorm.includes('ITAITUBA')) ||
    (origemNorm.includes('SANTARÉM') && destinoNorm.includes('ITAITUBA'))
  ) {
    // Horários que desembarcam na RODOVIÁRIA DE ITAITUBA
    if (horario === '13:00' || horario === '22:31') {
      return {
        texto: 'Desembarque na Rodoviária de Itaituba',
        tipo: 'desembarque',
        icone: '🚏'
      };
    }
    
    // Demais horários desembarcam em MIRITITUBA
    return {
      texto: 'Desembarque em Miritituba',
      tipo: 'desembarque',
      icone: '📍'
    };
  }

  // Sem observação para outras rotas
  return null;
}

/**
 * Retorna cor do badge baseado no tipo
 */
export function getCorObservacao(tipo: 'embarque' | 'desembarque' | 'ambos'): string {
  switch (tipo) {
    case 'embarque':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'desembarque':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'ambos':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}