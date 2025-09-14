"use client";

import { Exo_2 } from "next/font/google";
import { useEffect, useRef } from "react";
import SearchTabs from "@/components/search/SearchTabs";

const exo2 = Exo_2({ subsets: ["latin"], weight: ["700"] });

export default function Hero() {
  const stars = useRef<HTMLDivElement>(null);

  // gera estrelas leves (sem lib)
  useEffect(() => {
    const el = stars.current;
    if (!el) return;
    if (el.childElementCount) return;
    for (let i = 0; i < 50; i++) {
      const dot = document.createElement("i");
      dot.style.left = Math.random()*100 + "%";
      dot.style.top = Math.random()*100 + "%";
      dot.style.animationDelay = (Math.random()*2) + "s";
      el.appendChild(dot);
    }
  }, []);

  return (
    <section className="relative isolate min-h-[82vh] overflow-hidden bg-gradient-to-br from-navy to-primary text-white">
      {/* orbs/glow */}
      <div className="fx-orb fx-orb--gold w-80 h-80 -left-24 -top-20 animate-[float_10s_ease-in-out_infinite]" />
      <div className="fx-orb fx-orb--blue  w-96 h-96 -right-32 -bottom-24 animate-[glow_8s_ease-in-out_infinite]" />
      <div ref={stars} className="fx-stars" />
      <div className="fx-grain" />

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-24 grid content-center">
        <h1 className={`${exo2.className} text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight drop-shadow`}>
          Sua viagem de <span className="bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">ônibus</span>, simples e rápida.
        </h1>
        <p className="mt-4 max-w-2xl text-white/85">
          Compare horários, preços e rotas. Reserve em poucos cliques.
        </p>

        {/* Card de busca com gradient-border e tilt */}
        <div className="mt-8 md:mt-12 rounded-2xl gb p-[2px]">
          <div className="glass rounded-2xl border border-cloud/80 shadow-soft p-4 md:p-6 backdrop-saturate-150 tilt">
            <SearchTabs />
          </div>
        </div>

        {/* badges */}
        <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/85">
          <span className="rounded-full bg-white/15 px-3 py-1">Atendimento 24/7</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Parcelamento</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Parceiros oficiais</span>
        </div>
      </div>
    </section>
  );
}
