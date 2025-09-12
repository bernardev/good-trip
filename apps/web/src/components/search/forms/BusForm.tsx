"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function IconSwap(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 7h13m0 0-3-3m3 3-3 3M20 17H7m0 0 3 3m-3-3 3-3"/>
    </svg>
  );
}
function IconBus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6 3h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3v2a1 1 0 1 1-2 0v-2H8v2a1 1 0 1 1-2 0v-2a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v5h14V6a1 1 0 0 0-1-1H6Zm-1 9v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1H5Zm2 1.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
    </svg>
  );
}

export default function BusForm() {
  const r = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dateGo, setDateGo] = useState(today);
  const [oneWay, setOneWay] = useState(true);
  const [dateBack, setDateBack] = useState("");
  const [pax, setPax] = useState(1);
  const valid = from.trim() && to.trim() && dateGo;

  function swap() {
    setFrom(to); setTo(from);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const q = new URLSearchParams({ mode: "bus", from, to, date: dateGo, pax: String(pax) });
    if (!oneWay && dateBack) q.set("return", dateBack);
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (api) fetch(`${api}/v1/search?q=${encodeURIComponent(q.toString())}`).catch(() => {});
    r.push(`/buscar?${q.toString()}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      {/* pill da aba */}
      <div className="inline-flex items-center gap-2 rounded-full bg-accent/90 px-4 h-9 text-ink font-medium w-max">
        <IconBus className="h-4 w-4" /> Ônibus
      </div>

      {/* linha 1: origem/destino + swap */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2">
        <div className="relative">
          <input
            className="input w-full placeholder:text-ink/55"
            placeholder="Origem (ex: São Paulo - Tietê)"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span className="pointer-events-none absolute left-3 top-1.5 text-[10px] uppercase tracking-wide text-ink/50">Origem</span>
        </div>

        <button
          type="button"
          onClick={swap}
          className="h-12 w-12 rounded-xl border border-cloud bg-white hover:bg-cloud/40 transition grid place-items-center group"
          aria-label="Inverter origem e destino"
          title="Inverter"
        >
          <IconSwap className="h-5 w-5 text-ink/70 group-hover:rotate-180 transition-transform" />
        </button>

        <div className="relative">
          <input
            className="input w-full placeholder:text-ink/55"
            placeholder="Destino (ex: Curitiba - Rodoferroviária)"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <span className="pointer-events-none absolute left-3 top-1.5 text-[10px] uppercase tracking-wide text-ink/50">Destino</span>
        </div>
      </div>

      {/* linha 2: flags + pax */}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={oneWay}
            onChange={(e) => { setOneWay(e.target.checked); if (e.target.checked) setDateBack(""); }}
            className="h-5 w-5 accent-accent"
          />
          Somente ida
        </label>

        <div className="flex items-center gap-2 justify-end">
          <span className="text-sm text-ink/80">Passageiros</span>
          <input
            type="number" min={1}
            value={pax}
            onChange={(e) => setPax(Math.max(1, Number(e.target.value)))}
            className="input w-24 h-10"
          />
        </div>
      </div>

      {/* linha 3: datas */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date" min={today} value={dateGo}
          onChange={(e) => setDateGo(e.target.value)}
          className="input w-full"
        />
        <input
          type="date" min={dateGo || today} value={dateBack}
          onChange={(e) => setDateBack(e.target.value)}
          disabled={oneWay}
          className="input w-full disabled:opacity-50"
        />
      </div>

      {/* CTA */}
      <button
        type="submit"
        disabled={!valid}
        className="btn-cta h-12 w-full rounded-xl bg-accent text-ink font-semibold transition hover:bg-primary hover:text-white disabled:opacity-50"
        title={!valid ? "Preencha origem e destino" : "Buscar ônibus"}
      >
        Buscar ônibus
      </button>
    </form>
  );
}
