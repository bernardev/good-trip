"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import DistribusionWidgetIframe from "@/components/distribusion/DistribusionWidgetIframe";
import { useGeo } from "@/hooks/useGeo";

/* Tipos */
type Destination = {
  slug: string;
  city: string;
  uf: string;
  img?: string;
  fromCents?: number;
};

type NearbyApiResp = { origin_city: string; origin_lat: number; origin_lng: number; label: string };
type PopularItem = { city: string; uf: string; fromCents: number };
type PopularApiResp = { items: PopularItem[] };

/* Fallback (usa logo) */
const LOGO_SRC = "/logo-goodtrip.jpeg";
const FALLBACK: Destination[] = [
  { slug: "florianopolis", city: "Florianópolis", uf: "SC", img: LOGO_SRC, fromCents: 4999 },
  { slug: "joinville",     city: "Joinville",     uf: "SC", img: LOGO_SRC, fromCents: 4499 },
  { slug: "ponta-grossa",  city: "Ponta Grossa",  uf: "PR", img: LOGO_SRC, fromCents: 5982 },
  { slug: "sao-paulo",     city: "São Paulo",     uf: "SP", img: LOGO_SRC, fromCents: 13428 },
];

function formatFrom(cents?: number) {
  if (!Number.isFinite(cents)) return null;
  const [i, d] = (Number(cents) / 100).toFixed(2).split(".");
  return (
    <span className="text-white/90">
      <span className="text-[11px] sm:text-xs mr-1">a partir de</span>
      <span className="text-xl sm:text-2xl font-extrabold">{i}</span>
      <span>,{d}</span>
    </span>
  );
}

export default function DestinationsGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // modal
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Destination | null>(null);

  // origem/destinos dinâmicos
  const geo = useGeo();
  const [origin, setOrigin] = useState<{ label: string; lat: number; lng: number } | null>(null);
  const [items, setItems] = useState<Destination[] | null>(null);

  // animação on-view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // lock body scroll quando modal aberto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // buscar origem próxima + destinos populares (via lat/lng)
  useEffect(() => {
    if (!geo) return;

    (async () => {
      try {
        // 1) origem (reverse-geocode) – label + coords
        const r1 = await fetch(`/api/distribusion/nearby?lat=${geo.lat}&lng=${geo.lng}`);
        const j1: NearbyApiResp = await r1.json();
        if (!r1.ok || !Number.isFinite(j1.origin_lat) || !Number.isFinite(j1.origin_lng)) {
          throw new Error("nearby_failed");
        }
        setOrigin({ label: j1.label, lat: j1.origin_lat, lng: j1.origin_lng });

        // 2) destinos populares usando coordinates no /connections/find
        const r2 = await fetch(
          `/api/distribusion/popular?origin_lat=${j1.origin_lat}&origin_lng=${j1.origin_lng}&days=14&max=8`
        );
        const j2: PopularApiResp = await r2.json();
        if (!r2.ok || !Array.isArray(j2.items)) throw new Error("popular_failed");

        const list: Destination[] = j2.items.map((x) => ({
          slug: x.city.toLowerCase().replace(/\s+/g, "-"),
          city: x.city,
          uf: x.uf,
          fromCents: x.fromCents,
          img: LOGO_SRC, // usa logo padrão
        }));

        setItems(list.length ? list : FALLBACK);
      } catch {
        setItems(FALLBACK);
      }
    })();
  }, [geo]);

  const handleBuy = (dest: Destination) => {
    setSelected(dest);
    setOpen(true);
  };

  const list = items ?? FALLBACK;

  return (
    <section ref={sectionRef} className="relative bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 md:py-20">
        <div className="mb-6 md:mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-navy">
              {origin?.label ? `Destinos populares saindo de ${origin.label}` : "Destinos populares saindo da sua região"}
            </h2>
            <p className="text-ink/70 text-sm">Inspire-se e partiu viajar.</p>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {list.map((d, i) => {
            const imgSrc = d.img ?? LOGO_SRC;
            return (
              <article
                key={`${d.slug}-${i}`}
                className={`group relative rounded-2xl overflow-hidden border border-cloud bg-white shadow-soft p-[2px] ${
                  inView ? "animate-fade-up" : "opacity-0 translate-y-2"
                }`}
                style={inView ? { animationDelay: `${0.05 + i * 0.04}s` } : undefined}
              >
                <div className="relative h-48 sm:h-56 md:h-60 rounded-[14px] overflow-hidden bg-white">
                  <Image
                    src={imgSrc}
                    alt={d.city}
                    fill
                    className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.02] select-none bg-white"
                    sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                    priority={i < 2}
                  />

                  {/* vinheta e conteúdo inferior */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />
                  <div className="absolute left-3 right-3 bottom-3 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold text-base sm:text-lg leading-tight drop-shadow line-clamp-1">
                        {d.city} {d.uf ? <span className="text-white/80 text-sm">• {d.uf}</span> : null}
                      </h3>
                      {formatFrom(d.fromCents)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuy(d)}
                      className="shrink-0 rounded-xl bg-accent text-ink text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 shadow hover:bg-primary hover:text-white transition whitespace-nowrap"
                      aria-label={`Buscar horários para ${d.city}`}
                    >
                      Compre agora
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* CTA extra mobile */}
        <div className="mt-8 flex md:hidden justify-center">
          <button
            type="button"
            onClick={() => handleBuy({ slug: "todos", city: "Todos os destinos", uf: "", img: LOGO_SRC, fromCents: undefined })}
            className="h-11 px-6 rounded-xl border border-primary text-primary grid place-items-center hover:bg-primary hover:text-white transition whitespace-nowrap"
          >
            Ver todos os destinos
          </button>
        </div>
      </div>

      {/* glows */}
      <div aria-hidden className="absolute pointer-events-none -z-10 fx-orb fx-orb--gold w-56 h-56 sm:w-72 sm:h-72 -left-24 top-10 opacity-30" />
      <div aria-hidden className="absolute pointer-events-none -z-10 fx-orb fx-orb--blue w-64 h-64 sm:w-80 sm:h-80 -right-24 -bottom-16 opacity-30" />

      {/* MODAL */}
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-cloud mx-auto sm:mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-cloud/70 bg-white">
              <div className="min-w-0">
                <p className="text-xs text-ink/60 leading-none">Reservar viagem</p>
                <h3 className="text-base sm:text-lg font-semibold text-navy truncate">
                  {selected?.city ? `Destino: ${selected.city}` : "Buscar viagens"}
                </h3>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg border border-cloud px-3 py-1.5 text-sm hover:bg-cloud/50" aria-label="Fechar">
                Fechar
              </button>
            </div>

            <div className="p-3 sm:p-4">
              <div className="rounded-xl border border-cloud bg-white/70 p-3 sm:p-4 shadow-soft">
              <DistribusionWidgetIframe
                className="w-full"
                defaultOrigin={
                  origin ? { lat: origin.lat, lng: origin.lng, label: origin.label } : undefined
                }
                defaultDestination={selected?.city ? { label: selected.city } : undefined}
              />
              </div>
              <p className="mt-3 text-[11px] sm:text-xs text-ink/60">
                Preencha origem e data. O destino exibido acima é o que você selecionou no card.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
