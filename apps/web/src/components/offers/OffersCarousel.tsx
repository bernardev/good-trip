"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type OfferItem = {
  id: string;
  from: string;
  to: string;
  fromId: string;
  toId: string;
  priceCents: number;
  img?: string;
  active?: boolean;
  order?: number;
};
type Settings = {
  offers?: OfferItem[];
};

type Offer = { 
  id: string; 
  from: string; 
  to: string; 
  fromId: string;
  toId: string;
  priceCents: number; 
  img: string;
};

const DEFAULT_IMG = "/logo-goodtrip.jpeg";

export default function OffersCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/settings", { cache: "no-store" });
        
        if (!r.ok) {
          console.error("Erro ao buscar ofertas");
          setOffers([]);
          return;
        }

        const s: Settings = await r.json();

        const list = (s?.offers ?? [])
          .filter((o) => (o.active ?? true) && o.from && o.to && Number.isFinite(o.priceCents))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map<Offer>((o) => ({
            id: String(o.id),
            from: o.from,
            to: o.to,
            fromId: o.fromId,
            toId: o.toId,
            priceCents: o.priceCents,
            img: DEFAULT_IMG,
          }));

        setOffers(list);
      } catch (error) {
        console.error("Erro ao carregar ofertas:", error);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const scrollToIndex = (idx: number) => {
    const track = trackRef.current;
    const card = cardRefs.current[idx];
    if (!track || !card) return;
    const target = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
    track.scrollTo({ left: target, behavior: "smooth" });
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const mid = card.offsetLeft + card.clientWidth / 2;
        const d = Math.abs(mid - center);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
        const n = Math.min(1, d / (track.clientWidth * 0.6));
        const rot = (mid < center ? 1 : -1) * 12 * n;
        const scale = 1 - 0.15 * n;
        card.style.transform = `perspective(900px) rotateY(${rot}deg) scale(${scale})`;
        card.style.opacity = String(1 - 0.4 * n);
      });

      setActive(best);
    };

    onScroll();
    track.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(track);
    return () => {
      track.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [offers]);

  const goPrev = () => scrollToIndex(Math.max(0, active - 1));
  const goNext = () => scrollToIndex(Math.min(offers.length - 1, active + 1));

  // Gerar link de busca
  const gerarLinkBusca = (oferta: Offer): string => {
    const hoje = new Date().toISOString().split('T')[0];
    return `/buscar-teste?origem=${oferta.fromId}&destino=${oferta.toId}&data=${hoje}&tipo=oneway`;
  };

  if (!loading && offers.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-8 py-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-semibold text-navy">Passagens em destaque</h2>

        <Link
          href="#buscar"
          className="whitespace-nowrap shrink-0 rounded-full border border-primary text-primary
                     px-3 md:px-4 h-9 md:h-10 grid place-items-center text-sm md:text-base
                     hover:bg-primary hover:text-white transition"
        >
          Comece agora
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="ml-3 text-sm text-slate-600">Carregando ofertas...</p>
        </div>
      ) : (
        <div className="relative">
          {offers.length > 1 && (
            <>
              <button
                onClick={goPrev}
                aria-label="Anterior"
                className="grid absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-soft border border-cloud place-items-center hover:bg-cloud/30 z-10"
              >
                ‹
              </button>
              <button
                onClick={goNext}
                aria-label="Próximo"
                className="grid absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-soft border border-cloud place-items-center hover:bg-cloud/30 z-10"
              >
                ›
              </button>
            </>
          )}

          <div
            ref={trackRef}
            className="no-scrollbar flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth py-2"
            tabIndex={0}
          >
            {offers.map((o, i) => (
              <Link
                key={o.id}
                href={gerarLinkBusca(o)}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="snap-center shrink-0 w-[80%] sm:w-[58%] md:w-[38%] lg:w-[28%] rounded-2xl border border-cloud bg-white shadow-soft transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group"
              >
                <div className="relative h-44">
                  <Image src={o.img} alt="" fill className="object-contain bg-white" />
                  <div className="absolute left-3 top-3 rounded bg-accent text-ink text-xs font-semibold px-2 py-1 shadow">
                    % OFERTA
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-sm text-ink/70">{o.from}</div>
                  <div className="mt-1 font-semibold text-[17px] text-ink group-hover:text-primary transition-colors">{o.to}</div>
                  <div className="mt-3">
                    <div className="text-xs text-ink/60 mb-1">A partir de</div>
                    <div className="leading-none">
                      <span className="text-3xl md:text-4xl font-extrabold group-hover:text-primary transition-colors">
                        R$ {(o.priceCents / 100).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {offers.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              {offers.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Ir para slide ${i + 1}`}
                  aria-current={i === active}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === active ? "w-8 bg-primary" : "w-2.5 bg-cloud"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}