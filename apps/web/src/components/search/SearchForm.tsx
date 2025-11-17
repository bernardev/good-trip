// apps/web/src/components/search/SearchForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SearchParams = { data: string }; // YYYY-MM-DD
type Opt = { id: string; nome: string };               // VIOP
type City = { code: string; name: string };            // Distribusion

export default function SearchForm() {
  const router = useRouter();

  // VIOP
  const [origemViop, setOrigemViop] = useState<Opt | null>(null);
  const [destinoViop, setDestinoViop] = useState<Opt | null>(null);

  // Distribusion
  const [origemDist, setOrigemDist] = useState<City | null>(null);
  const [destinoDist, setDestinoDist] = useState<City | null>(null);

  // Comum
  const [data, setData] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;

    // montamos a query misturando (o que tiver disponível)
    const params = new URLSearchParams();
    params.set("data", data);

    // Distribusion (códigos de cidade)
    if (origemDist?.code && destinoDist?.code) {
      params.set("origem", origemDist.code);      // departureCity
      params.set("destino", destinoDist.code);    // arrivalCity
      params.set("passageiros", "1");
    }

    // VIOP (ids + nomes pra exibir)
    if (origemViop?.id && destinoViop?.id) {
      params.set("origemIdViop", origemViop.id);
      params.set("destinoIdViop", destinoViop.id);
      if (origemViop.nome) params.set("origemNomeViop", origemViop.nome);
      if (destinoViop.nome) params.set("destinoNomeViop", destinoViop.nome);
    }

    // precisa ter pelo menos um provedor preenchido
    if (!params.has("origem") && !params.has("origemIdViop")) return;

    router.push(`/buscar-unificado/resultados?${params.toString()}`);
  }

  const canSubmit =
    !!data &&
    ( (origemDist && destinoDist) || (origemViop && destinoViop) );

  return (
    <form onSubmit={go} className="grid gap-4">
      {/* Linha 1: VIOP */}
      <div className="grid md:grid-cols-2 gap-3">
        <OriginAutocompleteViop
          label="Origem (VIOP)"
          placeholder="Digite cidade/rodoviária"
          value={origemViop}
          onChange={setOrigemViop}
        />
        <DestinationAutocompleteViop
          label="Destino (VIOP)"
          placeholder={origemViop ? "Digite cidade/rodoviária" : "Selecione a origem VIOP"}
          origemId={origemViop?.id ?? ""}
          value={destinoViop}
          onChange={setDestinoViop}
        />
      </div>

      {/* Linha 2: Distribusion */}
      <div className="grid md:grid-cols-2 gap-3">
        <CityAutocompleteDist
          label="Origem (Distribusion)"
          placeholder="Digite a cidade"
          value={origemDist}
          onChange={setOrigemDist}
        />
        <CityAutocompleteDist
          label="Destino (Distribusion)"
          placeholder="Digite a cidade"
          value={destinoDist}
          onChange={setDestinoDist}
        />
      </div>

      {/* Data + botão */}
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <input
          type="date"
          className="rounded-xl border px-3 py-2 text-sm focus:border-blue-600"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
        />
        <button
          type="submit"
          className="rounded-xl bg-blue-600 text-white px-6 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
          disabled={!canSubmit}
        >
          Buscar
        </button>
      </div>
    </form>
  );
}

/* ===================== VIOP ===================== */
function OriginAutocompleteViop({
  label, placeholder, value, onChange,
}: {
  label: string; placeholder?: string;
  value: Opt | null; onChange: (v: Opt | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [opts, setOpts] = useState<Opt[]>([]);
  const deb = useRef<number | null>(null);

  useEffect(() => {
    if (!term) { setOpts([]); return; }
    setLoading(true);
    if (deb.current) window.clearTimeout(deb.current);
    deb.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/viop/origens?q=${encodeURIComponent(term)}`, { cache: "no-store" });
        const json = (await res.json()) as { ok: boolean; items?: Opt[] };
        setOpts(json.ok ? (json.items ?? []) : []);
      } finally {
        setLoading(false); setOpen(true);
      }
    }, 250);
    return () => { if (deb.current) window.clearTimeout(deb.current); };
  }, [term]);

  return (
    <AutocompleteShell
      label={label} placeholder={placeholder}
      term={term} setTerm={setTerm} open={open} setOpen={setOpen}
      loading={loading} opts={opts}
      renderItem={(o) => `${o.nome} (${o.id})`}
      onPick={(o) => { onChange(o); setTerm(o.nome); setOpen(false); }}
      onClear={() => onChange(null)}
      selectedText={value ? `Selecionado: ${value.nome} (ID ${value.id})` : ""}
    />
  );
}

function DestinationAutocompleteViop({
  label, placeholder, origemId, value, onChange,
}: {
  label: string; placeholder?: string; origemId: string;
  value: Opt | null; onChange: (v: Opt | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [opts, setOpts] = useState<Opt[]>([]);
  const deb = useRef<number | null>(null);

  useEffect(() => { setTerm(""); setOpts([]); setOpen(false); onChange(null); }, [origemId]); // reset ao trocar origem

  useEffect(() => {
    if (!origemId || !term) { setOpts([]); return; }
    setLoading(true);
    if (deb.current) window.clearTimeout(deb.current);
    deb.current = window.setTimeout(async () => {
      try {
        const url = `/api/viop/destinos?origemId=${encodeURIComponent(origemId)}&q=${encodeURIComponent(term)}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = (await res.json()) as { ok: boolean; items?: Opt[] };
        setOpts(json.ok ? (json.items ?? []) : []);
      } finally {
        setLoading(false); setOpen(true);
      }
    }, 250);
    return () => { if (deb.current) window.clearTimeout(deb.current); };
  }, [term, origemId, onChange]);

  return (
    <AutocompleteShell
      label={label} placeholder={placeholder}
      term={term} setTerm={setTerm} open={open} setOpen={setOpen}
      loading={loading} opts={opts} disabled={!origemId}
      renderItem={(o) => `${o.nome} (${o.id})`}
      onPick={(o) => { onChange(o); setTerm(o.nome); setOpen(false); }}
      onClear={() => onChange(null)}
      selectedText={value ? `Selecionado: ${value.nome} (ID ${value.id})` : ""}
    />
  );
}

/* ===================== Distribusion ===================== */
function CityAutocompleteDist({
  label, placeholder, value, onChange,
}: {
  label: string; placeholder?: string;
  value: City | null; onChange: (v: City | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [opts, setOpts] = useState<City[]>([]);
  const deb = useRef<number | null>(null);

  useEffect(() => {
    if (!term) { setOpts([]); return; }
    setLoading(true);
    if (deb.current) window.clearTimeout(deb.current);
    deb.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/distribusion/cities?q=${encodeURIComponent(term)}`, { cache: "no-store" });
        const json = (await res.json()) as { ok: boolean; items?: City[] };
        setOpts(json.ok ? (json.items ?? []) : []);
      } finally {
        setLoading(false); setOpen(true);
      }
    }, 200);
    return () => { if (deb.current) window.clearTimeout(deb.current); };
  }, [term]);

  return (
    <AutocompleteShell
      label={label} placeholder={placeholder}
      term={term} setTerm={setTerm} open={open} setOpen={setOpen}
      loading={loading} opts={opts}
      renderItem={(o) => `${o.name} — ${o.code}`}
      onPick={(o) => { onChange(o); setTerm(`${o.name} — ${o.code}`); setOpen(false); }}
      onClear={() => onChange(null)}
      selectedText={value ? `Selecionado: ${value.name} — ${value.code}` : ""}
    />
  );
}

/* ===================== Base genérica ===================== */
function AutocompleteShell<T>({
  label, placeholder, term, setTerm, open, setOpen, loading, opts, disabled,
  renderItem, onPick, onClear, selectedText,
}: {
  label: string; placeholder?: string; disabled?: boolean;
  term: string; setTerm: (v: string) => void;
  open: boolean; setOpen: (v: boolean) => void;
  loading: boolean; opts: T[];
  renderItem: (o: T) => string;
  onPick: (o: T) => void;
  onClear: () => void;
  selectedText?: string;
}) {
  return (
    <div className="relative">
      <label className="block text-sm mb-1">{label}</label>
      <input
        className="w-full rounded-xl border px-3 py-2 text-sm focus:border-blue-600 disabled:bg-slate-100"
        placeholder={placeholder}
        value={term}
        onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
        onFocus={() => term && setOpen(true)}
        autoComplete="off"
        disabled={disabled}
        required={false}
      />
      {selectedText && <p className="mt-1 text-xs text-slate-500">{selectedText}</p>}

      {open && (loading || opts.length > 0) && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow">
          {loading && <div className="px-3 py-2 text-sm text-slate-500">Carregando…</div>}
          {!loading &&
            opts.map((o, i) => (
              <button
                key={i}
                type="button"
                className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => onPick(o)}
              >
                {renderItem(o)}
              </button>
            ))}
          {!loading && opts.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">Nenhum resultado</div>
          )}
          {!loading && opts.length > 0 && (
            <div className="px-3 py-2 text-xs text-right text-slate-500 border-t">
              <button type="button" className="underline" onClick={onClear}>limpar seleção</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
