"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Destination = {
  slug: string;
  city: string;
  uf: string;
  img?: string;        // caminho dentro de /public
  fromCents?: number;  // preço “a partir de”
};

const DESTINATIONS: Destination[] = [
  { slug: "curitiba",   city: "Curitiba",   uf: "PR", img: "/destinations/curitiba.jpg",   fromCents: 4399 },
  { slug: "florianopolis", city: "Florianópolis", uf: "SC", img: "/destinations/florianopolis.jpg", fromCents: 4999 },
  { slug: "joinville",  city: "Joinville",  uf: "SC", img: "/destinations/joinville.jpg",  fromCents: 4499 },
  { slug: "sao-paulo",  city: "São Paulo",  uf: "SP", img: "/destinations/saopaulo.jpg",   fromCents: 5199 },
  { slug: "rio",        city: "Rio de Janeiro", uf: "RJ", img: "/destinations/rio.jpg",    fromCents: 6999 },
  { slug: "porto-alegre", city: "Porto Alegre", uf: "RS", img: "/destinations/portoalegre.jpg", fromCents: 7599 },
  { slug: "cascavel",   city: "Cascavel",   uf: "PR", img: "/destinations/cascavel.jpg",   fromCents: 4899 },
  { slug: "londrina",   city: "Londrina",   uf: "PR", img: "/destinations/londrina.jpg",   fromCents: 4599 },
];

function formatFrom(cents?: number) {
  if (!cents && cents !== 0) return null;
  const [i, d] = (cents / 100).toFixed(2).split(".");
  return (
    <span className="text-white/90">
      <span className="text-xs mr-1">a partir de</span>
      <span className="text-2xl font-extrabold">{i}</span>
      <span>,{d}</span>
    </span>
  );
}

export default function DestinationsGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

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

  return (
    <section ref={sectionRef} className="relative bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-14 md:py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-navy">Destinos populares</h2>
            <p className="text-ink/70 text-sm">Inspire-se e partiu viajar.</p>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {DESTINATIONS.map((d, i) => (
            <article
              key={d.slug}
              className={`group relative rounded-2xl overflow-hidden border border-cloud bg-white shadow-soft gb p-[2px] ${
                inView ? "animate-fade-up" : "opacity-0 translate-y-2"
              }`}
              style={inView ? { animationDelay: `${0.05 + i * 0.04}s` } : undefined}
            >
              <div className="relative h-56 sm:h-60 rounded-[14px] overflow-hidden">
                {/* imagem / fallback gradiente */}
                {d.img ? (
                  <Image
                    src={d.img}
                    alt={d.city}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                    priority={i < 2}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-navy to-primary" />
                )}

                {/* parallax sutil no hover */}
                <div className="pointer-events-none absolute inset-0 transition-transform duration-500 group-hover:-translate-y-1" />

                {/* vinheta e conteúdo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                <div className="absolute left-3 right-3 bottom-3 flex items-end justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg leading-tight drop-shadow">
                      {d.city} <span className="text-white/80 text-sm">• {d.uf}</span>
                    </h3>
                    {formatFrom(d.fromCents)}
                  </div>
                  <Link
                    href={`/buscar?destino=${encodeURIComponent(d.city)}`}
                    className="rounded-xl bg-accent text-ink text-sm font-semibold px-3 py-2 shadow hover:bg-primary hover:text-white transition"
                  >
                    Ver horários
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA mobile */}
        <div className="mt-8 flex md:hidden justify-center">
          <Link
            href="/buscar"
            className="h-11 px-6 rounded-xl border border-primary text-primary grid place-items-center hover:bg-primary hover:text-white transition"
          >
            Ver todos os destinos
          </Link>
        </div>
      </div>

      {/* glows suaves */}
      <div aria-hidden className="fx-orb fx-orb--gold w-72 h-72 -left-24 top-10 opacity-30" />
      <div aria-hidden className="fx-orb fx-orb--blue  w-80 h-80 -right-24 -bottom-16 opacity-30" />
    </section>
  );
}
