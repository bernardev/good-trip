// apps/web/src/app/buscar-viop/pre-compra/page.tsx
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, MapPin, Clock, Calendar, Users, Sparkles, ArrowRight, Check } from "lucide-react";

type SearchParams = {
  servico?: string;
  origem?: string;
  destino?: string;
  data?: string;
  assentos?: string;
  origemNome?: string;
  destinoNome?: string;
};
type Props = { searchParams: Promise<SearchParams> };

type ApiOnibusRes = {
  ok: boolean;
  serviceMeta?: {
    servico?: string;
    empresa?: string;
    classe?: string;
    preco?: number;
    precoOriginal?: number;
    tarifa?: number;
    poltronasTotal?: number;
    poltronasLivres?: number;
    dataCorrida?: string;
    saida?: string;
    chegada?: string;
  };
  seats?: {
    origem?: { cidade?: string; id?: number };
    destino?: { cidade?: string; id?: number };
  };
};

function toBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtTimeMaybe(isoOrHm?: string | null) {
  if (!isoOrHm) return "—";
  const d = new Date(isoOrHm);
  if (!Number.isNaN(d.getTime()))
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return isoOrHm;
}

function fmtDateYMD(ymd?: string) {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pt-BR", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric" 
  });
}

function diffMinutes(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const da = new Date(a);
  const db = new Date(b);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null;
  return Math.max(0, Math.round((db.getTime() - da.getTime()) / 60000));
}

function fmtDur(min: number | null) {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

export default async function PreCompraPage({ searchParams }: Props) {
  const sp = await searchParams;
  const servico = sp.servico ?? "";
  const origem = sp.origem ?? "";
  const destino = sp.destino ?? "";
  const data = sp.data ?? "";
  const assentosSel = (sp.assentos ?? "").split(",").map(s => s.trim()).filter(Boolean);

  if (!servico || !origem || !destino || !data || assentosSel.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="bg-white rounded-[2rem] shadow-xl p-8 text-center">
            <h1 className="text-2xl font-black text-gray-900 mb-4">Ops! Algo está faltando</h1>
            <p className="text-gray-600 mb-6">Parâmetros incompletos. Volte e selecione ao menos um assento.</p>
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

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const url = new URL(`${proto}://${host}/api/viop/onibus`);
  url.searchParams.set("servico", servico);
  url.searchParams.set("origemId", origem);
  url.searchParams.set("destinoId", destino);
  url.searchParams.set("data", data);

  const res = await fetch(url, { cache: "no-store" });
  const json: ApiOnibusRes | null = res.ok ? await res.json() : null;
  const meta = json?.serviceMeta;

  const origemNome = json?.seats?.origem?.cidade || sp.origemNome || origem;
  const destinoNome = json?.seats?.destino?.cidade || sp.destinoNome || destino;

  const precoUnit = meta?.preco ?? meta?.tarifa ?? 0;
  const precoCheio = meta?.precoOriginal ?? null;
  const descontoPct =
    precoCheio && precoCheio > 0 ? Math.max(0, Math.round((1 - precoUnit / precoCheio) * 100)) : null;

  const subtotal = Math.round(precoUnit * assentosSel.length * 100) / 100;
  const durMin = diffMinutes(meta?.saida ?? undefined, meta?.chegada ?? undefined);

  const nextParams = new URLSearchParams({
    servico, origem, destino, data, assentos: assentosSel.join(","),
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 py-8 md:py-12">
      <div className="container mx-auto max-w-4xl px-4">
        
        {/* Header com Título e Botão Voltar */}
        <div className="mb-8">
          <Link 
            href={`/buscar-viop/assentos?servico=${servico}&origem=${origem}&destino=${destino}&data=${data}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Alterar assentos
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-sky-600 rounded-2xl shadow-lg">
              <Check className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900">Confirmação da Viagem</h1>
              <p className="text-gray-600 mt-1">Revise os detalhes antes de continuar</p>
            </div>
          </div>
        </div>

        {/* Card Principal da Viagem */}
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden mb-6">
          
          {/* Header do Card - Rota */}
          <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-blue-600 p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 flex-shrink-0" />
                <span className="text-xl md:text-2xl font-black">{origemNome}</span>
              </div>
              <ArrowRight className="w-8 h-8 flex-shrink-0 animate-pulse" />
              <div className="flex items-center gap-3">
                <span className="text-xl md:text-2xl font-black text-right">{destinoNome}</span>
                <MapPin className="w-6 h-6 flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* Detalhes da Viagem */}
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Informações da Empresa */}
            <div className="flex flex-wrap items-center gap-3">
              {meta?.empresa && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-2 rounded-full border border-blue-200">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-gray-900">{meta.empresa}</span>
                </div>
              )}
              {meta?.classe && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-2 rounded-full border border-sky-200">
                  <span className="font-semibold text-gray-700">Classe: {meta.classe}</span>
                </div>
              )}
              {(meta?.poltronasLivres != null && meta?.poltronasTotal != null) && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border border-green-200">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-gray-700">{meta.poltronasLivres}/{meta.poltronasTotal} livres</span>
                </div>
              )}
            </div>

            {/* Grid de Horários */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Data */}
              <div className="relative bg-gradient-to-br from-blue-600 to-sky-600 rounded-2xl p-1 shadow-lg">
                <div className="bg-white rounded-[14px] p-4 h-full">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase">Data</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {fmtDateYMD(meta?.dataCorrida ?? data)}
                  </div>
                </div>
              </div>

              {/* Saída */}
              <div className="relative bg-gradient-to-br from-blue-600 to-sky-600 rounded-2xl p-1 shadow-lg">
                <div className="bg-white rounded-[14px] p-4 h-full">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase">Saída</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {fmtTimeMaybe(meta?.saida)}
                  </div>
                </div>
              </div>

              {/* Chegada */}
              <div className="relative bg-gradient-to-br from-sky-600 to-blue-600 rounded-2xl p-1 shadow-lg">
                <div className="bg-white rounded-[14px] p-4 h-full">
                  <div className="flex items-center gap-2 text-sky-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase">Chegada</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {fmtTimeMaybe(meta?.chegada)}
                  </div>
                  {durMin && (
                    <div className="text-xs text-gray-500 font-semibold mt-1">
                      Duração: {fmtDur(durMin)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-gray-200" />

            {/* Assentos Selecionados */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-gray-900">Assentos Selecionados</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {assentosSel.map((assento) => (
                  <div
                    key={assento}
                    className="bg-gradient-to-br from-blue-600 to-sky-600 text-white px-4 py-2 rounded-xl font-black shadow-lg"
                  >
                    {assento}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                {assentosSel.length} {assentosSel.length === 1 ? 'passageiro' : 'passageiros'}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-gray-200" />

            {/* Resumo Financeiro */}
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4">Resumo do Pagamento</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Preço Unitário */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                  <div className="text-sm text-gray-600 font-semibold mb-2">Preço por passageiro</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-gray-900">
                      {toBRL(precoUnit)}
                    </div>
                    {descontoPct !== null && descontoPct > 0 && (
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-black">
                        -{descontoPct}% OFF
                      </div>
                    )}
                  </div>
                  {precoCheio && precoCheio > precoUnit && (
                    <div className="text-sm text-gray-400 line-through mt-1">{toBRL(precoCheio)}</div>
                  )}
                </div>

                {/* Total */}
                <div className="relative bg-gradient-to-br from-blue-600 to-sky-600 rounded-2xl p-1 shadow-xl">
                  <div className="absolute inset-0 bg-blue-400 blur-xl opacity-30 rounded-2xl" />
                  <div className="relative bg-white rounded-[14px] p-6">
                    <div className="text-sm text-gray-600 font-semibold mb-2">Total a pagar</div>
                    <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                      {toBRL(subtotal)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão Continuar */}
              <Link
                href={`/buscar-viop/identificacao?${nextParams.toString()}`}
                className="w-full relative group overflow-hidden block"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="relative bg-gradient-to-r from-blue-600 via-sky-600 to-blue-600 text-white font-black py-5 rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02] flex items-center justify-center gap-3">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span className="text-lg">Continuar para Identificação</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 Valores e disponibilidade podem variar até a confirmação final da compra
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}