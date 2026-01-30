import { NextRequest, NextResponse } from "next/server";
import { Viop } from "@/lib/viop";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const origemId  = p.get("origemId");
  const destinoId = p.get("destinoId");
  const data      = p.get("data"); // YYYY-MM-DD

  if (!origemId || !destinoId || !data) {
    return NextResponse.json(
      { error: "origemId, destinoId e data (YYYY-MM-DD) são obrigatórios" },
      { status: 400 }
    );
  }

  const iso = `${data}T00:00:00.000Z`;
  const corridas = await Viop.buscarCorridas(origemId, destinoId, iso);
  
  // 🔥 Mapear para o formato esperado pelo ViopAdapter
  const corridasMapeadas = corridas.map((corrida) => {
    // Extrair hora de ISO (ex: "2026-01-23T22:30:00" → "22:30")
    const extrairHora = (isoString: string): string => {
      try {
        const date = new Date(isoString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      } catch {
        return '--:--';
      }
    };
    
    // Formatar duração (ex: 2350 minutos → "39h 10min")
    const formatarDuracao = (minutos: number): string => {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    };
    
    // Se tem conexão, usar nomes dos trechos
    const origem = corrida.conexao 
      ? corrida.conexao.primeiroTrechoOrigemDescricao 
      : 'Origem'; // Fallback (não deveria acontecer)
      
    const destino = corrida.conexao
      ? corrida.conexao.segundoTrechoDestinoDescricao
      : 'Destino'; // Fallback
    
    return {
      id: corrida.id,
      origem,
      destino,
      dataPartida: data, // YYYY-MM-DD
      horarioPartida: extrairHora(corrida.dataPartida),
      horarioChegada: extrairHora(corrida.dataChegada),
      duracao: formatarDuracao(corrida.duracaoMin),
      preco: corrida.tarifaDesde,
      assentosDisponiveis: 10, // API VIOP não retorna isso no buscarCorridas
      tipo: corrida.conexao ? 'Conexão' : 'Convencional',
      nomeEmpresa: corrida.operadora,
      servico: corrida.id,
      conexao: corrida.conexao, 
    };
  });
  
  return NextResponse.json({ total: corridasMapeadas.length, corridas: corridasMapeadas }, { status: 200 });
}