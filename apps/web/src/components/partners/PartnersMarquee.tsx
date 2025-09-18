"use client";

import Image from "next/image";

type Partner = { name: string; src?: string; };

const PARTNERS: Partner[] = [
  { name: "Distribusion", src: "/partners/distribusion.svg" },
  { name: "buser",        src: "/partners/buser.svg" },
  { name: "Blablacar",    src: "/partners/blablacar.svg" },
];

// Fallback simples se não tiver logo no /public/partners/*
function PartnerBadge({ p }: { p: Partner }) {
  if (p.src) {
    return (
      <div className="h-10 md:h-12 w-auto opacity-70 hover:opacity-100 transition">
        <Image
          src={p.src}
          alt={p.name}
          width={140}
          height={48}
          className="h-full w-auto object-contain"
        />
      </div>
    );
  }
  return (
    <div className="h-10 md:h-12 min-w-[120px] rounded-xl border border-cloud bg-white grid place-items-center px-4 text-ink/70">
      {p.name}
    </div>
  );
}

export default function PartnersMarquee() {
  // Duplicamos a lista para um loop realmente contínuo
  const track = [...PARTNERS, ...PARTNERS];

  return (
    <section className="relative bg-[#f7f9fc]">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h3 className="text-navy text-xl md:text-2xl font-semibold">Parceiros oficiais</h3>
            <p className="text-ink/70 text-sm">Integrações com as principais viações e plataformas.</p>
          </div>
          <div className="hidden md:flex gap-2 text-xs">
            <span className="rounded-full bg-cloud/70 px-3 py-1">Compra segura</span>
            <span className="rounded-full bg-cloud/70 px-3 py-1">PIX & Cartão</span>
            <span className="rounded-full bg-cloud/70 px-3 py-1">Suporte 24/7</span>
          </div>
        </div>

        {/* MARQUEE */}
        <div className="marquee relative overflow-hidden rounded-2xl border border-cloud bg-white/70 backdrop-blur-xl gb p-4">
          <div
            className="marquee-track items-center"
            aria-label="Logos de parceiros rolando automaticamente"
          >
            {track.map((p, i) => (
              <PartnerBadge key={`${p.name}-${i}`} p={p} />
            ))}
          </div>
        </div>

        {/* Selos abaixo — mobile */}
        <div className="mt-5 flex md:hidden gap-2 text-xs justify-center">
          <span className="rounded-full bg-cloud/70 px-3 py-1">Compra segura</span>
          <span className="rounded-full bg-cloud/70 px-3 py-1">PIX & Cartão</span>
          <span className="rounded-full bg-cloud/70 px-3 py-1">Suporte 24/7</span>
        </div>
      </div>

      {/* glows suaves */}
      <div aria-hidden className="fx-orb fx-orb--gold w-72 h-72 -left-24 top-6 opacity-30" />
      <div aria-hidden className="fx-orb fx-orb--blue  w-80 h-80 -right-24 -bottom-10 opacity-30" />
    </section>
  );
}
