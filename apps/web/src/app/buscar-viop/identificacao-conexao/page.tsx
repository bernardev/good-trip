// apps/web/src/app/buscar-viop/identificacao-conexao/page.tsx
import IdentificacaoConexaoClient from "@/components/buscar/IdentificacaoConexaoClient";
import { headers } from "next/headers";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = {
  servico1?: string;
  origem1?: string;
  destino1?: string;
  data1?: string;
  assento1?: string;
  servico2?: string;
  origem2?: string;
  destino2?: string;
  data2?: string;
  assento2?: string;
  conexao?: string;
};

type PageProps = { searchParams: Promise<SearchParams> };

type ViopCity = {
  id: number;
  nome: string;
};

type ViopCitiesResponse = {
  ok: boolean;
  items?: ViopCity[];
};

function formatViopCity(nome: string): string {
  const cleaned = nome.trim().toUpperCase();
  
  // 🔥 Se já está no formato "CIDADE/UF", retorna formatado
  if (/^[^/]+\/[A-Z]{2}$/.test(cleaned)) {
    const [cidade, estado] = cleaned.split('/');
    const cidadeFormatada = cidade
      .toLowerCase()
      .split(' ')
      .map((word) => 
        ['de', 'do', 'da', 'dos', 'das', 'e'].includes(word) 
          ? word 
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(' ')
      .replace(/\bSao\b/g, 'São');
    
    return `${cidadeFormatada}/${estado}`;
  }
  
  // 🔥 Formato antigo: "CIDADE - UF" ou "CIDADE"
  const stateMatch = cleaned.match(/[A-Z]{2}$/);
  const estado = stateMatch ? stateMatch[0] : '';
  const cidadeMatch = cleaned.match(/^([^-]+)/);
  const cidadeRaw = cidadeMatch ? cidadeMatch[1].trim() : cleaned;
  const cidade = cidadeRaw
    .toLowerCase()
    .split(' ')
    .map((word) => 
      ['de', 'do', 'da', 'dos', 'das', 'e'].includes(word) 
        ? word 
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ')
    .replace(/\bSao\b/g, 'São');
  
  return estado ? `${cidade}/${estado}` : cidade;
}

export default async function IdentificacaoConexaoPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const trecho1 = {
    servico: sp.servico1 ?? "",
    origem: sp.origem1 ?? "",
    destino: sp.destino1 ?? "",
    data: sp.data1 ?? "",
    assento: sp.assento1 ?? "",
  };

  const trecho2 = {
    servico: sp.servico2 ?? "",
    origem: sp.origem2 ?? "",
    destino: sp.destino2 ?? "",
    data: sp.data2 ?? "",
    assento: sp.assento2 ?? "",
  };

  const hasMinParams = !!(
    trecho1.servico && trecho1.origem && trecho1.destino && trecho1.data && trecho1.assento &&
    trecho2.servico && trecho2.origem && trecho2.destino && trecho2.data && trecho2.assento
  );

  if (!hasMinParams) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="bg-white rounded-[2rem] shadow-xl p-8 text-center">
            <h1 className="text-2xl font-black text-gray-900 mb-4">Ops! Algo está faltando</h1>
            <p className="text-gray-600 mb-6">Parâmetros incompletos. Volte à seleção de assentos e tente novamente.</p>
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

  // 🔥 Buscar nomes das cidades (igual produção)
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";

  let origemNome1 = trecho1.origem;
  let destinoNome1 = trecho1.destino;
  let origemNome2 = trecho2.origem;
  let destinoNome2 = trecho2.destino;

  try {
    // 🔥 Buscar TODAS as origens primeiro
    const origensUrl = new URL(`${proto}://${host}/api/viop/origens`);
    origensUrl.searchParams.set('q', '');
    const origensRes = await fetch(origensUrl, { cache: "no-store" });
    
    if (origensRes.ok) {
      const origensData: ViopCitiesResponse = await origensRes.json();
      if (origensData.ok && origensData.items) {
        // Buscar origem do trecho 1
        const origem1City = origensData.items.find((c) => String(c.id) === String(trecho1.origem));
        if (origem1City) {
          origemNome1 = formatViopCity(origem1City.nome);
          console.log('✅ Origem Trecho 1:', origem1City.nome, '→', origemNome1);
        } else {
          console.warn('⚠️ Origem Trecho 1 não encontrada:', trecho1.origem);
        }

        // Buscar origem do trecho 2 (que é o destino do trecho 1)
        const origem2City = origensData.items.find((c) => String(c.id) === String(trecho2.origem));
        if (origem2City) {
          origemNome2 = formatViopCity(origem2City.nome);
          console.log('✅ Origem Trecho 2:', origem2City.nome, '→', origemNome2);
        } else {
          console.warn('⚠️ Origem Trecho 2 não encontrada:', trecho2.origem);
        }
      }
    }

    // 🔥 Buscar destino do trecho 1
    const destinosUrl1 = new URL(`${proto}://${host}/api/viop/destinos`);
    destinosUrl1.searchParams.set('origemId', trecho1.origem);
    destinosUrl1.searchParams.set('q', '');
    const destinosRes1 = await fetch(destinosUrl1, { cache: "no-store" });
    
    if (destinosRes1.ok) {
      const destinosData1: ViopCitiesResponse = await destinosRes1.json();
      if (destinosData1.ok && destinosData1.items) {
        const destino1City = destinosData1.items.find((c) => String(c.id) === String(trecho1.destino));
        if (destino1City) {
          destinoNome1 = formatViopCity(destino1City.nome);
          console.log('✅ Destino Trecho 1:', destino1City.nome, '→', destinoNome1);
        } else {
          console.warn('⚠️ Destino Trecho 1 não encontrado:', trecho1.destino);
        }
      }
    }

    // 🔥 Buscar destino do trecho 2
    const destinosUrl2 = new URL(`${proto}://${host}/api/viop/destinos`);
    destinosUrl2.searchParams.set('origemId', trecho2.origem);
    destinosUrl2.searchParams.set('q', '');
    const destinosRes2 = await fetch(destinosUrl2, { cache: "no-store" });
    
    if (destinosRes2.ok) {
      const destinosData2: ViopCitiesResponse = await destinosRes2.json();
      if (destinosData2.ok && destinosData2.items) {
        const destino2City = destinosData2.items.find((c) => String(c.id) === String(trecho2.destino));
        if (destino2City) {
          destinoNome2 = formatViopCity(destino2City.nome);
          console.log('✅ Destino Trecho 2:', destino2City.nome, '→', destinoNome2);
        } else {
          console.warn('⚠️ Destino Trecho 2 não encontrado:', trecho2.destino);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao buscar nomes das cidades:', error);
  }

  const trecho1ComNomes = {
    ...trecho1,
    origemNome: origemNome1,
    destinoNome: destinoNome1,
  };

  const trecho2ComNomes = {
    ...trecho2,
    origemNome: origemNome2,
    destinoNome: destinoNome2,
  };

  console.log('🔍 [SERVER] Trecho 1 com nomes:', trecho1ComNomes);
  console.log('🔍 [SERVER] Trecho 2 com nomes:', trecho2ComNomes);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 py-8 md:py-12">
      <div className="container mx-auto max-w-6xl px-4">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/buscar-teste"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para seleção de assentos
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-sky-600 rounded-2xl shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900">Identificação do Passageiro</h1>
              <p className="text-gray-600 mt-1">Preencha seus dados para os 2 trechos da viagem</p>
            </div>
          </div>
        </div>

        {/* Componente Cliente */}
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden">
          <IdentificacaoConexaoClient
            trecho1={trecho1ComNomes}
            trecho2={trecho2ComNomes}
          />
        </div>
      </div>
    </main>
  );
}