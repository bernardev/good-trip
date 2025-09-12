"use client";

import { Exo_2 } from "next/font/google";
import SearchTabs from "@/components/search/SearchTabs";

const exo2 = Exo_2({ subsets: ["latin"], weight: ["700"] });

export default function Hero() {
  return (
    <section className="relative isolate min-h-[80vh] overflow-hidden bg-gradient-to-br from-navy to-primary text-white">
      {/* glows animados */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-accent/35 blur-3xl animate-floaty"></div>
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-floaty" style={{animationDelay:"-2s"}}></div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-24 grid content-center">
        <h1 className={`${exo2.className} animate-fade-up text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight drop-shadow`}>
          Sua viagem de <span className="bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">ônibus</span>, simples e rápida.
        </h1>
        <p className="animate-fade-up [animation-delay:.08s] mt-4 max-w-2xl text-white/85">
          Compare horários, preços e rotas. Reserve em poucos cliques.
        </p>

        {/* Card de busca */}
        <div className="animate-fade-up [animation-delay:.14s] glass mt-8 md:mt-12 rounded-2xl border border-cloud/80 shadow-soft p-4 md:p-6 backdrop-saturate-150">
          <SearchTabs />
        </div>

        {/* trust bar com leve flutuação */}
        <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/85">
          <span className="animate-floaty rounded-full bg-white/10 px-3 py-1">Atendimento 24/7</span>
          <span className="animate-floaty rounded-full bg-white/10 px-3 py-1" style={{animationDelay:"-1s"}}>Parcelamento</span>
          <span className="animate-floaty rounded-full bg-white/10 px-3 py-1" style={{animationDelay:"-2s"}}>Parceiros oficiais</span>
        </div>
      </div>
    </section>
  );
}
