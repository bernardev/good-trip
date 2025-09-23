"use client";

import Image from "next/image";

type Partner = { name: string; src: `/${string}.png` };

const PARTNERS: readonly Partner[] = [
  { name: "Expresso Guanabara",            src: "/expresso-guanabara.png" },
  { name: "Gontijo",                       src: "/gontijo-logo.png" },
  { name: "Andorinha",                     src: "/logo-andorinha.png" },
  { name: "Juína",                         src: "/logo-juina.png" },
  { name: "Expresso São Luiz",             src: "/logo-viacao-expresso-sao-luiz.png" },
  { name: "Satélite Norte",                src: "/logo-viacao-satelite-norte.png" },
  { name: "Xavante",                       src: "/logo-viacao-xavante.png" },
  { name: "Amatur",                        src: "/p-logo-viacao-amatur.png" },
  { name: "Boa Esperança",                 src: "/p-logo-viacao-boa-esperanca.png" },
  { name: "Liderança",                     src: "/p-logo-viacao-lideranca.png" },
  { name: "VIOP",                          src: "/viop-logo.png" },
];

function PartnerBadge({ p }: { p: Partner }) {
  return (
    <div
      className="h-12 md:h-16 w-[168px] md:w-[220px] shrink-0 opacity-80 hover:opacity-100 transition"
      title={p.name}
      aria-label={p.name}
    >
      <Image
        src={p.src}
        alt={p.name}
        width={220}   // <— aumente junto com a largura do card
        height={64}   // <— aumente junto com a altura do card
        className="h-full w-full object-contain"
        sizes="(min-width: 768px) 220px, 168px"
        priority={false}
      />
    </div>
  );
}

export default function PartnersMarquee() {
  // Duplicamos para loop contínuo da marquee
  const track = [...PARTNERS, ...PARTNERS];

  return (
    <section className="relative bg-[#F3F6FA]">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h3 className="text-navy text-xl md:text-2xl font-semibold">Parceiros oficiais</h3>
            <p className="text-ink/70 text-sm">Integrações com as principais viações e plataformas.</p>
          </div>
          <div className="hidden md:flex gap-2 text-xs">
            <span className="rounded-full bg-cloud/70 px-3 py-1">Compra segura</span>
            <span className="rounded-full bg-cloud/70 px-3 py-1">PIX &amp; Cartão</span>
            <span className="rounded-full bg-cloud/70 px-3 py-1">Suporte 24/7</span>
          </div>
        </div>

        {/* MARQUEE */}
        <div className="marquee relative overflow-hidden rounded-2xl border border-cloud/0 bg-[#F3F6FA] p-4">
          <div className="marquee-track items-center" aria-label="Logos de parceiros rolando automaticamente">
            {track.map((p, i) => (
              <PartnerBadge key={`${p.name}-${i}`} p={p} />
            ))}
          </div>
        </div>

        {/* Selos abaixo — mobile */}
        <div className="mt-5 flex md:hidden gap-2 text-xs justify-center">
          <span className="rounded-full bg-cloud/70 px-3 py-1">Compra segura</span>
          <span className="rounded-full bg-cloud/70 px-3 py-1">PIX &amp; Cartão</span>
          <span className="rounded-full bg-cloud/70 px-3 py-1">Suporte 24/7</span>
        </div>
      </div>

      {/* glows suaves */}
      <div aria-hidden className="fx-orb fx-orb--gold w-72 h-72 -left-24 top-6 opacity-30" />
      <div aria-hidden className="fx-orb fx-orb--blue  w-80 h-80 -right-24 -bottom-10 opacity-30" />
    </section>
  );
}
