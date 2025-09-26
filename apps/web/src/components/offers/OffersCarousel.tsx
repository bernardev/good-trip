"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useGeo } from "@/hooks/useGeo";

/* Tipos */
type Offer = { id: string; from: string; to: string; priceCents: number; img: string };

type NearbyApiResp = { origin_city: string; origin_lat: number; origin_lng: number; label: string };
type PopularItem = { city: string; uf: string; fromCents: number };
type PopularApiResp = { items: PopularItem[] };

/* Fallback básico se API cair */
const FALLBACK: Offer[] = [
  { id: "cwb-joi", from: "Curitiba, PR", to: "Joinville, SC",         priceCents: 4399,  img: "/logo-goodtrip.jpeg" },
  { id: "cwb-fln", from: "Curitiba, PR", to: "Florianópolis, SC",     priceCents: 4499,  img: "/logo-goodtrip.jpeg" },
  { id: "cwb-sp",  from: "Curitiba, PR", to: "São Paulo - Tietê, SP", priceCents: 4899,  img: "/logo-goodtrip.jpeg" },
  { id: "cwb-poa", from: "Curitiba, PR", to: "Porto Alegre, RS",      priceCents: 11299, img: "/logo-goodtrip.jpeg" },
];

export default function OffersCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  // origem dinâmica + ofertas
  const geo = useGeo();
  const [offers, setOffers] = useState<Offer[]>(FALLBACK);

  // Buscar origem e ofertas (mesma lógica do DestinationsGrid)
  useEffect(() => {
    if (!geo) return;

    (async () => {
      try {
        const r1 = await fetch(`/api/distribusion/nearby?lat=${geo.lat}&lng=${geo.lng}`);
        const j1: NearbyApiResp = await r1.json();
        if (!r1.ok) throw new Error("nearby_failed");

        const r2 = await fetch(
          `/api/distribusion/popular?origin_lat=${j1.origin_lat}&origin_lng=${j1.origin_lng}&days=14&max=8`
        );
        const j2: PopularApiResp = await r2.json();
        if (!r2.ok || !Array.isArray(j2.items)) throw new Error("popular_failed");

        const fromLabel = j1.label; // ex.: “Curitiba, PR”
        const list: Offer[] = j2.items.map((x, idx) => ({
          id: `${j1.origin_city}-${idx}`,
          from: fromLabel,
          to: `${x.city}${x.uf ? `, ${x.uf}` : ""}`,
          priceCents: x.fromCents,
          img: "/logo-goodtrip.jpeg",
        }));

        setOffers(list.length ? list : FALLBACK);
      } catch {
        setOffers(FALLBACK);
      }
    })();
  }, [geo]);

  // centraliza index com precisão
  const scrollToIndex = (idx: number) => {
    const track = trackRef.current;
    const card = cardRefs.current[idx];
    if (!track || !card) return;
    const target = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
    track.scrollTo({ left: target, behavior: "smooth" });
  };

  // calcula item mais central e aplica coverflow leve
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
        const n = Math.min(1, d / (track.clientWidth * 0.6)); // 0..1
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
  }, []);

  const goPrev = () => scrollToIndex(Math.max(0, active - 1));
  const goNext = () => scrollToIndex(Math.min(offers.length - 1, active + 1));

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

      <div className="relative">
        {/* Setas */}
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

        {/* Trilha */}
        <div
          ref={trackRef}
          className="no-scrollbar flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth py-2"
          tabIndex={0}
        >
          {offers.map((o, i) => (
            <article
              key={o.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="snap-center shrink-0 w-[80%] sm:w-[58%] md:w-[38%] lg:w-[28%] rounded-2xl border border-cloud bg-white shadow-soft transition-transform duration-300 gb tilt"
            >
              <div className="relative h-44">
                <Image src={o.img} alt="" fill className="object-contain bg-white" />
                <div className="absolute left-3 top-3 rounded bg-accent text-ink text-xs font-semibold px-2 py-1 shadow">
                  % OFERTA
                </div>
              </div>
              <div className="p-4">
                <div className="text-sm text-ink/70">{o.from}</div>
                <div className="mt-1 font-semibold text-[17px] text-ink">{o.to}</div>
                <div className="mt-3">
                  <div className="text-xs text-ink/60 mb-1">A partir de</div>
                  <div className="leading-none">
                    <span className="text-3xl md:text-4xl font-extrabold">
                      {(o.priceCents / 100).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Dots */}
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
      </div>
    </section>
  );
}
