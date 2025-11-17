// apps/web/src/app/buscar-viop/pre-compra/page.tsx
import Link from "next/link";
import { headers } from "next/headers";

type SearchParams = {
  servico?: string;
  origem?: string;
  destino?: string;
  data?: string;
  assentos?: string;
  origemNome?: string;   // opcional: se vier dos resultados, mostramos o nome
  destinoNome?: string;  // opcional
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

    dataCorrida?: string;  // YYYY-MM-DD
    saida?: string;        // ISO ou "HH:mm"
    chegada?: string;      // ISO ou "HH:mm"
  };
};

function toBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtTimeMaybe(isoOrHm?: string | null) {
  if (!isoOrHm) return "—";
  // tenta ISO
  const d = new Date(isoOrHm);
  if (!Number.isNaN(d.getTime()))
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  // fallback: assume HH:mm
  return isoOrHm;
}
function fmtDateYMD(ymd?: string) {
  if (!ymd) return "—";
  const d = new Date(ymd);
  if (!Number.isNaN(d.getTime()))
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return ymd;
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
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export default async function PreCompraPage({ searchParams }: Props) {
  const sp = await searchParams;
  const servico = sp.servico ?? "";
  const origem = sp.origem ?? "";
  const destino = sp.destino ?? "";
  const data = sp.data ?? "";
  const origemNome = sp.origemNome ?? origem;
  const destinoNome = sp.destinoNome ?? destino;
  const assentosSel = (sp.assentos ?? "").split(",").map(s => s.trim()).filter(Boolean);

  if (!servico || !origem || !destino || !data || assentosSel.length === 0) {
    return (
      <main className="container mx-auto max-w-3xl py-8">
        <h1 className="text-xl font-semibold mb-2">Pré-compra</h1>
        <p>Parâmetros incompletos. Volte e selecione ao menos um assento.</p>
      </main>
    );
  }

  // Busca metas/preços/horários na sua rota já existente
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
    <main className="container mx-auto max-w-3xl py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pré-compra</h1>
        <Link href={`/buscar-viop/assentos?servico=${servico}&origem=${origem}&destino=${destino}&data=${data}`}
              className="text-sm text-blue-700 hover:underline">
          Alterar assentos
        </Link>
      </div>

      {/* Cabeçalho do trecho */}
      <section className="rounded-2xl border p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <span className="inline-flex items-center gap-2">
            <strong>{origemNome}</strong> → <strong>{destinoNome}</strong>
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
            Data: {fmtDateYMD(meta?.dataCorrida ?? data)}
          </span>
          {meta?.empresa && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
              {meta.empresa}{meta.classe ? ` · ${meta.classe}` : ""}
            </span>
          )}
          {(meta?.poltronasLivres != null && meta?.poltronasTotal != null) && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
              Livres: {meta.poltronasLivres}/{meta.poltronasTotal}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border p-3">
            <div className="text-slate-500">Saída</div>
            <div className="text-base font-medium">{fmtTimeMaybe(meta?.saida)}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-slate-500">Chegada</div>
            <div className="text-base font-medium">{fmtTimeMaybe(meta?.chegada)}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-slate-500">Duração</div>
            <div className="text-base font-medium">{fmtDur(durMin)}</div>
          </div>
        </div>
      </section>

      {/* Resumo financeiro */}
      <section className="rounded-2xl border p-4 space-y-3">
        <div className="text-sm text-slate-600">Resumo</div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Assentos escolhidos:</span>
          <strong>{assentosSel.join(", ")}</strong>
          <span className="text-slate-500">({assentosSel.length} {assentosSel.length === 1 ? "passageiro" : "passageiros"})</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border p-3">
            <div className="text-slate-500 text-sm">Preço unitário</div>
            <div className="text-lg font-semibold">
              {precoUnit ? toBRL(precoUnit) : "—"}
              {descontoPct !== null && (
                <span className="ml-2 text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5">
                  -{descontoPct}%
                </span>
              )}
            </div>
            {precoCheio && precoCheio > precoUnit && (
              <div className="text-xs text-slate-500 line-through">{toBRL(precoCheio)}</div>
            )}
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-slate-500 text-sm">Subtotal</div>
            <div className="text-lg font-semibold">{toBRL(subtotal)}</div>
          </div>
        </div>

        <div className="pt-1">
          <Link
            href={`/buscar-viop/identificacao?${nextParams.toString()}`}
            className="inline-block rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
          >
            Continuar
          </Link>
        </div>

        <p className="text-xs text-slate-500">
          Valores e disponibilidade podem variar até a confirmação final da compra.
        </p>
      </section>
    </main>
  );
}
