import IdentificacaoClient from "@/components/buscar/IdentificacaoClient";
import { headers } from "next/headers";
import { ArrowLeft, User, Sparkles } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = {
  servico?: string;
  origem?: string;
  destino?: string;
  data?: string;
  assentos?: string;
  preco?: string;
  empresa?: string;
  classe?: string;
  saida?: string;
  chegada?: string;
};

type PageProps = { searchParams: Promise<SearchParams> };

type ApiOnibusRes = {
  ok: boolean;
  serviceMeta?: {
    preco?: number;
    empresa?: string;
    classe?: string;
    saida?: string;
    chegada?: string;
  };
  seats?: {
    origem?: { cidade?: string; id?: number };
    destino?: { cidade?: string; id?: number };
  };
};

export default async function IdentificacaoPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const servico = sp.servico ?? "";
  const origem = sp.origem ?? "";
  const destino = sp.destino ?? "";
  const data = sp.data ?? "";
  const assentos = (sp.assentos ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const hasMinParams = !!(servico && origem && destino && data);

  if (!hasMinParams) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="bg-white rounded-[2rem] shadow-xl p-8 text-center">
            <h1 className="text-2xl font-black text-gray-900 mb-4">Ops! Algo está faltando</h1>
            <p className="text-gray-600 mb-6">Parâmetros incompletos. Volte à pré-compra e tente novamente.</p>
            <Link 
              href="/buscar-teste"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-sky-700 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar para busca
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 🔥 Buscar dados da API para pegar nomes das cidades e preço correto
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const url = new URL(`${proto}://${host}/api/viop/onibus`);
  url.searchParams.set("servico", servico);
  url.searchParams.set("origemId", origem);
  url.searchParams.set("destinoId", destino);
  url.searchParams.set("data", data);

  let origemNome = origem;
  let destinoNome = destino;
  let precoReal: number | undefined = sp.preco ? Number(sp.preco) : undefined;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const json: ApiOnibusRes = await res.json();
      origemNome = json?.seats?.origem?.cidade || origem;
      destinoNome = json?.seats?.destino?.cidade || destino;
      precoReal = json?.serviceMeta?.preco ?? precoReal;
    }
  } catch (err) {
    console.error("Erro ao buscar dados da viagem:", err);
  }

  const meta: {
    preco?: number;
    empresa?: string;
    classe?: string;
    saida?: string;
    chegada?: string;
    origemNome?: string;
    destinoNome?: string;
  } = {
    preco: precoReal,
    empresa: sp.empresa,
    classe: sp.classe,
    saida: sp.saida,
    chegada: sp.chegada,
    origemNome,
    destinoNome,
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 py-8 md:py-12">
      <div className="container mx-auto max-w-4xl px-4">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/buscar-viop/pre-compra?servico=${servico}&origem=${origem}&destino=${destino}&data=${data}&assentos=${assentos.join(",")}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para resumo
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-sky-600 rounded-2xl shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900">Identificação do Passageiro</h1>
              <p className="text-gray-600 mt-1">Preencha os dados dos passageiros</p>
            </div>
          </div>
        </div>

        {/* Componente Cliente */}
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden">
          <IdentificacaoClient
            query={{ servico, origem, destino, data, assentos }}
            meta={meta}
          />
        </div>
      </div>
    </main>
  );
}