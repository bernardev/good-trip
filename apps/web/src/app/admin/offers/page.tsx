"use client";

import { useEffect, useMemo, useState } from "react";
import type { Settings, OfferItem } from "@/../types/settings";

/* Constantes iguais ao front */
const DEFAULT_IMG = "/logo-goodtrip.jpeg";
const FALLBACK_OFFERS: OfferItem[] = [
  { id: "cwb-joi", from: "Curitiba, PR", to: "Joinville, SC",         priceCents: 4399,  img: DEFAULT_IMG, active: true, order: 1 },
  { id: "cwb-fln", from: "Curitiba, PR", to: "Florianópolis, SC",     priceCents: 4499,  img: DEFAULT_IMG, active: true, order: 2 },
  { id: "cwb-sp",  from: "Curitiba, PR", to: "São Paulo - Tietê, SP", priceCents: 4899,  img: DEFAULT_IMG, active: true, order: 3 },
  { id: "cwb-poa", from: "Curitiba, PR", to: "Porto Alegre, RS",      priceCents: 11299, img: DEFAULT_IMG, active: true, order: 4 },
];

type NearbyApiResp = { origin_city: string; origin_lat: number; origin_lng: number; label: string };
type PopularItem   = { city: string; uf: string; fromCents: number };
type PopularApiResp = { items: PopularItem[] };

type Source = "site" | "geo" | "fallback";

/* Helpers */
const stripEmpty = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined)) as Partial<T>;

const normalizeOffers = (list: OfferItem[]) =>
  list
    .filter((o) => o && o.from && o.to && Number.isFinite(o.priceCents))
    .map((o, i) => ({
      id: String(o.id || `offer-${Date.now()}-${i}`),
      from: o.from!,
      to: o.to!,
      priceCents: Math.max(0, Number(o.priceCents) || 0),
      img: o.img || DEFAULT_IMG,
      active: o.active ?? true,
      order: (o.order && o.order > 0 ? o.order : i + 1),
    })) as OfferItem[];

/* Formatação BRL (mostra em reais, salva centavos) */
const formatBRL = (cents: number) =>
  (Math.max(0, Number.isFinite(cents) ? cents : 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    // mínimo de frações 2 para garantir vírgula
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const parseBRLToCents = (input: string) => {
  // pega só dígitos (aceita colar "R$ 1.234,56" etc.)
  const digits = (input || "").replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

export default function OffersAdmin() {
  const [settings, setSettings] = useState<Settings>({ banner: {}, offers: [] });
  const offers = settings.offers ?? [];
  const [source, setSource] = useState<Source>("fallback");
  const [loading, setLoading] = useState(true);

  const sourceLabel = useMemo(() => {
    if (source === "site") return "Origem: Site (/api/settings)";
    if (source === "geo") return "Origem: Localização (popular)";
    return "Origem: Fallback";
  }, [source]);

  useEffect(() => {
    (async () => {
      try {
        // 1) carrega o documento do admin (para manter banner/header/footer)
        const rAdmin = await fetch("/api/admin/settings", { cache: "no-store" });
        const sAdmin: Settings = await rAdmin.json();
        setSettings(sAdmin ?? { banner: {}, offers: [] });

        // 2) tenta o que o SITE está exibindo (mesma rota pública do front)
        const rSite = await fetch("/api/settings", { cache: "no-store" });
        if (rSite.ok) {
          const sSite: Settings = await rSite.json();
          const siteOffers = normalizeOffers(
            (sSite?.offers ?? [])
              .filter((o) => (o.active ?? true) && o.from && o.to && Number.isFinite(o.priceCents))
              .sort(
                (a, b) =>
                  (a.order ?? 0) - (b.order ?? 0) ||
                  String(a.id).localeCompare(String(b.id))
              )
          );
          if (siteOffers.length) {
            setSettings((prev) => ({ ...prev, offers: siteOffers }));
            setSource("site");
            setLoading(false);
            return;
          }
        }

        // 3) se o site não tem ofertas, replica a lógica GEO do front
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation
            ? navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 })
            : reject(new Error("Geolocalização indisponível"))
        );
        const { latitude: lat, longitude: lng } = pos.coords;

        const r1 = await fetch(`/api/distribusion/nearby?lat=${lat}&lng=${lng}`);
        const j1: NearbyApiResp = await r1.json();
        if (!r1.ok) throw new Error("nearby_failed");

        const r2 = await fetch(
          `/api/distribusion/popular?origin_lat=${j1.origin_lat}&origin_lng=${j1.origin_lng}&days=14&max=8`
        );
        const j2: PopularApiResp = await r2.json();
        if (!r2.ok || !Array.isArray(j2.items)) throw new Error("popular_failed");

        const fromLabel = j1.label;
        const geoOffers = normalizeOffers(
          j2.items.map((x, idx) => ({
            id: `${j1.origin_city}-${idx}`,
            from: fromLabel,
            to: `${x.city}${x.uf ? `, ${x.uf}` : ""}`,
            priceCents: x.fromCents,
            img: DEFAULT_IMG,
            active: true,
            order: idx + 1,
          }))
        );

        if (geoOffers.length) {
          setSettings((prev) => ({ ...prev, offers: geoOffers }));
          setSource("geo");
          setLoading(false);
          return;
        }

        // 4) fallback
        setSettings((prev) => ({ ...prev, offers: FALLBACK_OFFERS }));
        setSource("fallback");
      } catch {
        setSettings((prev) => ({ ...prev, offers: FALLBACK_OFFERS }));
        setSource("fallback");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateOffer = (idx: number, patch: Partial<OfferItem>) => {
    setSettings((prev) => {
      const list = [...(prev.offers ?? [])];
      list[idx] = { ...list[idx], ...patch };
      return { ...prev, offers: list };
    });
  };

  const addOffer = () => {
    const base: OfferItem = {
      id: `offer-${Date.now()}`,
      from: "",
      to: "",
      priceCents: 0,
      img: DEFAULT_IMG,
      active: true,
      order: (offers?.length ?? 0) + 1,
    };
    setSettings((prev) => ({ ...prev, offers: [...(prev.offers ?? []), base] }));
  };

  const removeOffer = (idx: number) =>
    setSettings((prev) => ({
      ...prev,
      offers: (prev.offers ?? []).filter((_, i) => i !== idx).map((o, k) => ({ ...o, order: k + 1 })),
    }));

  const move = (idx: number, dir: -1 | 1) =>
    setSettings((prev) => {
      const list = [...(prev.offers ?? [])];
      const j = idx + dir;
      if (j < 0 || j >= list.length) return prev;
      [list[idx], list[j]] = [list[j], list[idx]];
      return { ...prev, offers: list.map((o, k) => ({ ...o, order: k + 1 })) };
    });

  const save = async () => {
    const payload: Settings = {
      ...settings,
      offers: normalizeOffers(offers).map((o) => stripEmpty(o)) as OfferItem[],
    };
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    alert(res.ok ? "Salvo" : "Erro ao salvar");
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-semibold">Ofertas (carrossel)</h2>
          <span className="text-xs px-2 py-1 rounded bg-white/10 border border-white/15">{sourceLabel}</span>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-white/70">Carregando ofertas atuais do site…</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-white/70">
              Estas são as ofertas atualmente exibidas no frontend para você. Edite e clique em <b>Salvar alterações</b> para publicá-las.
            </p>

            <div className="mt-5 grid gap-4">
              {(offers ?? []).map((o, idx) => (
                <div key={o.id} className="rounded-xl border border-white/10 bg-white/[.06] p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="rounded-lg bg-white/[.06] border border-white/10 p-3"
                      placeholder="Origem (ex.: Curitiba, PR)"
                      value={o.from ?? ""}
                      onChange={(e) => updateOffer(idx, { from: e.target.value })}
                    />
                    <input
                      className="rounded-lg bg-white/[.06] border border-white/10 p-3"
                      placeholder="Destino (ex.: Florianópolis, SC)"
                      value={o.to ?? ""}
                      onChange={(e) => updateOffer(idx, { to: e.target.value })}
                    />

                    {/* Preço em BRL (mostra em reais, salva em centavos) */}
                    <input
                      className="rounded-lg bg-white/[.06] border border-white/10 p-3 font-medium"
                      placeholder="R$ 44,99"
                      inputMode="decimal"
                      aria-label="Preço (em reais)"
                      value={formatBRL(o.priceCents ?? 0)}
                      onChange={(e) => {
                        const cents = parseBRLToCents(e.target.value);
                        updateOffer(idx, { priceCents: cents });
                      }}
                      onBlur={(e) => {
                        const cents = parseBRLToCents(e.target.value);
                        updateOffer(idx, { priceCents: cents });
                      }}
                    />

                    <input
                      className="rounded-lg bg-white/[.06] border border-white/10 p-3"
                      placeholder={`Imagem (URL) — ou deixe vazio para ${DEFAULT_IMG}`}
                      value={o.img ?? ""}
                      onChange={(e) => updateOffer(idx, { img: e.target.value })}
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={o.active ?? true}
                        onChange={(e) => updateOffer(idx, { active: e.target.checked })}
                      />
                      Ativa
                    </label>

                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => move(idx, -1)} className="h-9 px-3 rounded-lg border border-white/15">↑</button>
                      <button onClick={() => move(idx, 1)}  className="h-9 px-3 rounded-lg border border-white/15">↓</button>
                      <button onClick={() => removeOffer(idx)} className="h-9 px-3 rounded-lg border border-red-400 text-red-300">
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <button onClick={addOffer} className="rounded-xl border border-white/15 px-4 h-11 hover:bg-white/10">
                Adicionar oferta
              </button>
              <button onClick={save} className="rounded-xl bg-primary px-5 h-11 font-semibold hover:opacity-95">
                Salvar alterações
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
