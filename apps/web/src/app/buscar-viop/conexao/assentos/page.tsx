// apps/web/src/app/buscar-viop/conexao/assentos/page.tsx
import { headers } from "next/headers";
import { Bus, AlertCircle } from "lucide-react";
import Link from "next/link";
import ConexaoAssentosClient from "@/components/buscar/ConexaoAssentosClient";

type SearchParams = { 
  servico?: string; 
  origem?: string; 
  destino?: string; 
  data?: string;
};

type Props = { 
  searchParams: Promise<SearchParams>;
};

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

type ApiConexaoResponse = {
  ok: boolean;
  conexao?: ConexaoData;
  error?: string;
};

export default async function ConexaoAssentosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const servico = sp.servico ?? "";
  const origem = sp.origem ?? "";
  const destino = sp.destino ?? "";
  const data = sp.data ?? "";

  // Validação de parâmetros
  if (!servico || !origem || !destino || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-xl border border-slate-200 text-center">
          <div className="rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Parâmetros Incompletos</h1>
          <p className="text-slate-600 mb-6">
            Não foi possível carregar a seleção de assentos. Por favor, volte e tente novamente.
          </p>
          <Link
            href="/buscar-viop"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Bus className="w-5 h-5" />
            Voltar para busca
          </Link>
        </div>
      </main>
    );
  }

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";

  const url = new URL(`${proto}://${host}/api/viop/conexao`);
  url.searchParams.set("servico", servico);
  url.searchParams.set("origemId", origem);
  url.searchParams.set("destinoId", destino);
  url.searchParams.set("data", data);

  let json: ApiConexaoResponse;
  
  try {
    const res = await fetch(url, { cache: "no-store" });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    json = await res.json();
  } catch (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-xl border border-slate-200 text-center">
          <div className="rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Erro ao Carregar</h1>
          <p className="text-slate-600 mb-6">
            Não foi possível buscar as informações da conexão. Por favor, tente novamente.
          </p>
          <Link
            href={`/buscar-viop/conexao?servico=${servico}&origem=${origem}&destino=${destino}&data=${data}`}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  // Verificar se retornou dados válidos
  if (!json.ok || !json.conexao || !json.conexao.temConexao) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-xl border border-slate-200 text-center">
          <div className="rounded-full bg-orange-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Erro nos Dados</h1>
          <p className="text-slate-600 mb-6">
            Esta viagem não possui dados de conexão válidos.
          </p>
          <Link
            href="/buscar-viop"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Bus className="w-5 h-5" />
            Voltar para busca
          </Link>
        </div>
      </main>
    );
  }

  const conexao = json.conexao;

  return (
    <ConexaoAssentosClient
      trecho1={{
        servico: conexao.trechos[0].servico,
        origem: conexao.trechos[0].origem,
        destino: conexao.trechos[0].destino,
        origemNome: conexao.trechos[0].origemDescricao,
        destinoNome: conexao.trechos[0].destinoDescricao,
        data: data,
      }}
      trecho2={{
        servico: conexao.trechos[1].servico,
        origem: conexao.trechos[1].origem,
        destino: conexao.trechos[1].destino,
        origemNome: conexao.trechos[1].origemDescricao,
        destinoNome: conexao.trechos[1].destinoDescricao,
        data: data,
      }}
      maxPassageiros={1}
    />
  );
}