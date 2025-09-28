// app/popular-debug/page.tsx
"use client";

import { useEffect, useMemo, useState, useId } from "react";
import { z } from "zod";

// ===== Config (inalterada) =====
const PARTNER =
  (process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER as string | undefined) ?? "814999";
const LOCALE = "pt-BR";
const CURRENCY = "BRL";

// ===== Tipagem do retorno real =====
const LocationSchema = z.object({
  code: z.string(),
  name: z.string(),
  type: z.string(),
});

const CustomStylingSchema = z
  .object({
    enabled: z.boolean().optional(),
    backgroundImage: z.string().url().optional(),
  })
  .passthrough();

const ConnectionSchema = z
  .object({
    customStyling: CustomStylingSchema.optional(),
    departureDate: z.object({ enabled: z.boolean().optional() }).optional(),
    passengerTypes: z
      .object({
        enabled: z.boolean().optional(),
        supported: z.array(z.unknown()).optional(),
      })
      .optional(),
    arrivalLocation: LocationSchema,
    departureLocation: LocationSchema,
  })
  .passthrough();

const ApiShapeSchema = z
  .object({
    connections: z.array(ConnectionSchema),
  })
  .passthrough();

// ===== DTO para o front =====
type PopularConn = {
  from: { code: string; name: string; type: string };
  to: { code: string; name: string; type: string };
  bgImage?: string;
  departureDateEnabled: boolean;
  passengerTypesEnabled: boolean;
};

function toDTO(item: z.infer<typeof ConnectionSchema>): PopularConn {
  return {
    from: {
      code: item.departureLocation.code,
      name: item.departureLocation.name,
      type: item.departureLocation.type,
    },
    to: {
      code: item.arrivalLocation.code,
      name: item.arrivalLocation.name,
      type: item.arrivalLocation.type,
    },
    bgImage: item.customStyling?.backgroundImage,
    departureDateEnabled: Boolean(item.departureDate?.enabled),
    passengerTypesEnabled: Boolean(item.passengerTypes?.enabled),
  };
}

// ===== Utils =====
function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map((v) => Number(v));
  const base = new Date(y, m - 1, d);
  base.setDate(base.getDate() + days);
  const mm = String(base.getMonth() + 1).padStart(2, "0");
  const dd = String(base.getDate()).padStart(2, "0");
  return `${base.getFullYear()}-${mm}-${dd}`;
}
function fmtDateBR(iso: string): string {
  const [y, m, d] = iso.split("-").map((v) => Number(v));
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}
function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// ===== Skeleton =====
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-40 w-full animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-6 w-3/5 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-14 animate-pulse rounded-xl bg-slate-200" />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div className="h-11 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-11 w-32 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

// ===== Card =====
function PopularCard({ c }: { c: PopularConn }) {
  const [date, setDate] = useState<string>(todayISO());
  const [pax, setPax] = useState<number>(1);
  const uid = useId();

  const bookUrl = useMemo(() => {
    const u = new URL("https://www.goodtrip.com.br/result");
    u.searchParams.set("departureStation", c.from.code);
    u.searchParams.set("arrivalStation", c.to.code);
    u.searchParams.set("departureDate", date);
    u.searchParams.set("pax", String(pax));
    u.searchParams.set("retailerPartnerNumber", PARTNER);
    u.searchParams.set("locale", LOCALE);
    u.searchParams.set("currency", CURRENCY);
    return u.toString();
  }, [c, date, pax]);


  // Quick chips
  const baseToday = todayISO();
  const dateChips: ReadonlyArray<{ label: string; value: string }> = [
    { label: "Hoje", value: baseToday },
    { label: "+1", value: addDaysISO(baseToday, 1) },
    { label: "+2", value: addDaysISO(baseToday, 2) },
  ];

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E6E8EF] bg-white shadow-[0_6px_22px_rgba(16,24,40,0.06)]">
      {/* Capa com overlay e título */}
      <div
        className="relative h-40 w-full"
        style={{
          background: c.bgImage
            ? `center/cover no-repeat url(${c.bgImage})`
            : "linear-gradient(135deg,#0b74a5,#1e3a8a)",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute left-4 right-4 top-3">
          <span className="rounded-full bg-yellow-400/95 px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow">
            POPULAR
          </span>
        </div>
        <div className="absolute bottom-3 left-4 right-4 text-white drop-shadow">
          <h3 className="text-[18px] font-semibold leading-tight">
            {c.from.name} <span className="opacity-80">→</span> {c.to.name}
          </h3>
          <p className="text-[12px] opacity-90">
            {fmtDateBR(date)} • {pax} passageir{pax > 1 ? "os" : "o"}
          </p>
        </div>
      </div>

      {/* Corpo (fora da imagem) */}
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {c.departureDateEnabled && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <label htmlFor={`date-${uid}`} className="block text-[12px] text-slate-600">
                Data de partida
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id={`date-${uid}`}
                  type="date"
                  value={date}
                  min={todayISO()}
                  onChange={(e) => setDate(e.currentTarget.value)}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-[14px] outline-none focus:border-sky-400"
                />
              </div>
              <div className="mt-2 flex gap-1.5">
                {dateChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setDate(chip.value)}
                    className={cx(
                      "rounded-full border px-2 py-0.5 text-[11px]",
                      date === chip.value
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    )}
                    aria-pressed={date === chip.value}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {c.passengerTypesEnabled && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <span className="block text-[12px] text-slate-600">Passageiros</span>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Diminuir passageiros"
                  onClick={() => setPax((v) => Math.max(1, v - 1))}
                  className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  −
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={pax}
                  onChange={(e) => {
                    const v = Number(e.currentTarget.value);
                    setPax(Number.isNaN(v) || v < 1 ? 1 : v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") setPax((v) => v + 1);
                    if (e.key === "ArrowDown") setPax((v) => Math.max(1, v - 1));
                  }}
                  className="w-full max-w-[96px] rounded-lg border border-slate-200 px-2.5 py-2 text-center text-[14px] outline-none focus:border-sky-400"
                />
                <button
                  type="button"
                  aria-label="Aumentar passageiros"
                  onClick={() => setPax((v) => v + 1)}
                  className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <a
            href={bookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(
              "rounded-xl bg-[#0B74A5] px-4 py-3 text-center text-[15px] font-bold text-white",
              "shadow-[0_8px_20px_rgba(11,116,165,0.35)] transition-all hover:brightness-[1.08] active:scale-[0.99]"
            )}
          >
            Compre agora
          </a>
        </div>
      </div>
    </article>
  );
}

// ===== Página =====
export default function Page() {
  const [data, setData] = useState<PopularConn[]>([]);
  const [rawShape, setRawShape] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const url = new URL("https://book.api.distribusion.com/api/popular_connections");
        url.searchParams.set("currency", CURRENCY);
        url.searchParams.set("locale", LOCALE);
        url.searchParams.set("retailerPartnerNumber", PARTNER);

        const res = await fetch(url.toString(), {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} — ${body.slice(0, 200)}`);
        }

        const json: unknown = await res.json();
        const parsed = ApiShapeSchema.parse(json);

        setRawShape(json);
        setData(parsed.connections.map(toDTO));
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError((e as Error).message || "Erro desconhecido");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  const lines = useMemo(
    () => data.map((it, i) => `${i + 1}. ${it.from.name} → ${it.to.name}`),
    [data]
  );

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold text-slate-800">Popular Connections — Debug</h1>
        <p className="mt-1 text-sm text-slate-500">
          Capa com overlay e controles abaixo, mantendo deep-link para a busca oficial.
        </p>
      </header>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Falha ao carregar</p>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <h2 className="mb-3 mt-2 text-[18px] font-medium text-slate-800">
            Conexões ({data.length})
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {data.map((c, idx) => (
              <PopularCard key={`${c.from.code}-${c.to.code}-${idx}`} c={c} />
            ))}
          </div>

          {/* Debug opcional */}
          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-[16px] font-medium text-slate-800">Resumo</h3>
            <pre className="mt-2 whitespace-pre-wrap text-[13px] text-slate-700">{lines.join("\n")}</pre>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-slate-600">
                Raw shape (como veio da API)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-[12px] text-slate-600">
                {JSON.stringify(rawShape, null, 2)}
              </pre>
            </details>
          </section>
        </>
      )}
    </main>
  );
}
