// apps/web/src/app/buscar-viop/assentos/page.tsx
import { headers } from "next/headers";
import AssentosClient from "@/components/buscar/AssentosClient";
import { Bus, AlertCircle } from "lucide-react";

type SearchParams = { servico?: string; origem?: string; destino?: string; data?: string };
type Props = { searchParams: Promise<SearchParams> };

type ApiSeat = {
  numero: string | number;
  livre?: boolean | 0 | 1 | "LIVRE" | "OCUPADO" | "DISPONIVEL" | "INDISPONIVEL" | "TRUE" | "FALSE";
  status?: string;
  disponivel?: boolean | 0 | 1 | string;
  classe?: string;
};
type ApiSeats = { mapaPoltrona?: ApiSeat[] };
type ApiOnibusRes = {
  ok: boolean;
  seats?: ApiSeats;
  serviceMeta?: {
    servico?: string;
    preco?: number;
    precoOriginal?: number;
    tarifa?: number;
    classe?: string;
    empresa?: string;
    empresaId?: number;
    poltronasTotal?: number;
    poltronasLivres?: number;
    dataCorrida?: string;
    saida?: string;
    chegada?: string;
  };
};

function seatIsFree(p: ApiSeat): boolean {
  const raw = (p.livre ?? p.disponivel ?? p.status);
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw === 1;
  if (raw == null) return false;
  const v = String(raw).trim().toUpperCase();
  return ["LIVRE", "DISPONIVEL", "AVAILABLE", "FREE", "TRUE", "SIM", "1"].includes(v);
}

export default async function AssentosPage({ searchParams }: Props) {
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
            Não foi possível carregar a seleção de assentos. Por favor, volte e selecione novamente sua viagem.
          </p>
          <a
            href="/buscar-viop"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Bus className="w-5 h-5" />
            Voltar para busca
          </a>
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

  let json: ApiOnibusRes;
  
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Erro ao Carregar Assentos</h1>
          <p className="text-slate-600 mb-6">
            Não foi possível buscar as informações dos assentos. Por favor, tente novamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </main>
    );
  }

const poltronas = (json.seats?.mapaPoltrona ?? [])
  .map((p): { numero: string; livre: boolean; classe?: string } => ({
    numero: String(p.numero ?? ""),
    livre: seatIsFree(p),
    classe: p.classe,
  }))
  .filter(p => {
    // Filtrar: não vazio, não WC, e DEVE SER NÚMERO
    if (!p.numero || p.numero === "") return false;
    if (p.numero.toUpperCase() === "WC") return false;
    
    // ✅ NOVO: Aceitar apenas números
    const isNumeric = /^\d+$/.test(p.numero);
    return isNumeric;
  });

  const meta = {
    poltronasTotal: json.serviceMeta?.poltronasTotal,
    poltronasLivres: json.serviceMeta?.poltronasLivres,
    preco: json.serviceMeta?.preco,
    empresa: json.serviceMeta?.empresa,
    classe: json.serviceMeta?.classe,
  };

  return <AssentosClient poltronas={poltronas} meta={meta} query={{ servico, origem, destino, data }} maxSelect={5} />;
}