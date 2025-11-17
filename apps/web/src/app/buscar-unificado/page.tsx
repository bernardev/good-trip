// apps/web/src/app/buscar-unificado/page.tsx
import { headers } from "next/headers";
import DistribusionSlot from "@/components/unified/DistribusionSlot";

type RawSearchParams = {
  origem?: string;
  destino?: string;
  data?: string;       // YYYY-MM-DD
  pax?: string;        // "1".."30"
  locale?: string;     // "pt-BR" | "en" ...
  currency?: string;   // "BRL" | "EUR" ...
  origemCode?: string; // códigos da Distribusion (opcionais)
  destinoCode?: string;
};

type NormalizedCriteria = {
  origem: string;
  destino: string;
  data: string;
  pax: number;
  locale: string;
  currency: string;
  origemCode?: string;
  destinoCode?: string;
};

type Props = { searchParams: Promise<RawSearchParams> };

enum Provider { VIOP = "VIOP", DISTRIBUSION = "DISTRIBUSION" }

export default async function UnifiedSearchPage({ searchParams }: Props) {
  const sp = await searchParams;

  const criteria: NormalizedCriteria = {
    origem: (sp.origem ?? "").trim(),
    destino: (sp.destino ?? "").trim(),
    data: (sp.data ?? "").trim(),
    pax: clampInt(sp.pax, 1, 30, 1),
    locale: (sp.locale ?? "pt-BR").trim(),
    currency: (sp.currency ?? "BRL").trim(),
    origemCode: (sp.origemCode ?? "").trim() || undefined,
    destinoCode: (sp.destinoCode ?? "").trim() || undefined,
  };

  const ready =
    Boolean(criteria.origem) &&
    Boolean(criteria.destino) &&
    /^\d{4}-\d{2}-\d{2}$/.test(criteria.data);

  const provider: Provider = chooseProvider(criteria);

  const hdr = await headers();
  const host = hdr.get("x-forwarded-host") ?? hdr.get("host") ?? "";
  const proto = (hdr.get("x-forwarded-proto") ?? "https") + "://";
  const absoluteBase = host ? `${proto}${host}` : "";

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Resultados da busca</h1>
        <p className="mt-2 text-sm text-gray-600">
          {criteria.origem || "—"} → {criteria.destino || "—"} · {criteria.data || "—"} · {criteria.pax} pax · {criteria.locale} · {criteria.currency}
        </p>
      </header>

      <section
        aria-label="conteúdo-unificado"
        className="rounded-xl border border-gray-200 bg-white shadow-sm min-h-[50vh] p-4 md:p-6"
      >
        {!ready ? (
          <div className="text-gray-500 text-sm grid place-items-center min-h-[40vh]">
            Informe origem, destino e data para visualizar as opções.
          </div>
        ) : provider === Provider.VIOP ? (
          <ViopPlaceholder criteria={criteria} />
        ) : (
          <DistribusionSlot criteria={criteria} />
        )}
      </section>

      <div className="sr-only">
        <span data-abs-base={absoluteBase} data-provider={provider} />
      </div>
    </main>
  );
}

/* ---------- Helpers ---------- */
function clampInt(v: string | undefined, min: number, max: number, fallback: number): number {
  const n = Number(v ?? "");
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
function isNumericId(s: string): boolean {
  return /^[0-9]+$/.test(s);
}
function chooseProvider(c: NormalizedCriteria): Provider {
  // Provisório: IDs numéricos → VIOP ; caso contrário → Distribusion
  if (isNumericId(c.origem) && isNumericId(c.destino)) return Provider.VIOP;
  return Provider.DISTRIBUSION;
}

/* ---------- Placeholder temporário do VIOP ---------- */
function ViopPlaceholder({ criteria }: { criteria: NormalizedCriteria }) {
  return (
    <div className="grid gap-3">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
        Fluxo nativo <strong>VIOP</strong> (listagem → mapa de poltronas → dados).
      </div>
      <div className="grid gap-2 text-sm text-gray-700">
        <div>Listando viagens de {criteria.origem} para {criteria.destino} em {criteria.data}…</div>
        <div className="h-28 rounded-md border border-gray-200 bg-gray-50 animate-pulse" />
        <div className="h-28 rounded-md border border-gray-200 bg-gray-50 animate-pulse" />
      </div>
    </div>
  );
}
