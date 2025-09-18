"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Exo_2 } from "next/font/google";

const exo2 = Exo_2({ subsets: ["latin"], weight: ["700"] });

type Step = { title: string; desc: string; icon: ReactNode };

const IconSearch = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M21 21l-3.8-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const IconTicket = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 8a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h14l2-2V8l-2-2H5a2 2 0 0 0-2 2Z" stroke="currentColor" strokeWidth="2" />
    <path d="M14 8v8M10 10h2M10 14h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconPayment = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
    <rect x="6.5" y="13" width="5" height="2.5" rx="1.25" fill="currentColor" />
  </svg>
);
const IconBoard = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M7 20h10M12 18v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const STEPS: Step[] = [
  { title: "Busque", desc: "Origem, destino e data. Compare horários e preços.", icon: IconSearch },
  { title: "Escolha", desc: "Selecione o ônibus ideal e o assento preferido.", icon: IconTicket },
  { title: "Pague",  desc: "Cartão, Pix ou boleto. Processo rápido e seguro.",  icon: IconPayment },
  { title: "Embarque", desc: "Receba tudo por e-mail e app. É só apresentar.",  icon: IconBoard },
];

export default function HowItWorks() {
  const wrapRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
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
    <section ref={wrapRef} className="relative bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-14 md:py-20">
        <div className="text-center mb-10">
          <h2 className={`${exo2.className} text-3xl md:text-4xl font-extrabold text-navy`}>
            Como <span className="text-accent">funciona</span>
          </h2>
          <p className="mt-3 text-ink/70">Em poucos passos você está no caminho do seu próximo destino.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className={`group rounded-2xl gb p-[2px] ${inView ? "animate-fade-up" : "opacity-0 translate-y-2"}`}
              style={inView ? { animationDelay: `${0.06 + i * 0.06}s` } : undefined}
            >
              <article className="tilt rounded-2xl bg-white border border-cloud shadow-soft p-5 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 grid place-items-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition">
                    {s.icon}
                  </div>
                  <span className="h-8 min-w-8 px-2 grid place-items-center rounded-full bg-accent text-ink text-sm font-semibold shadow">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm text-ink/70">{s.desc}</p>

                <div className="mt-4 h-1.5 rounded-full bg-cloud/70 overflow-hidden">
                  <span className="block h-full bg-primary w-0 group-hover:w-full transition-[width] duration-500" />
                </div>
              </article>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="#buscar"
            className="rounded-2xl bg-primary text-white px-6 h-12 grid place-items-center font-semibold shadow-soft hover:opacity-95 transition active:translate-y-[1px]"
          >
            Comece sua busca agora
          </a>
        </div>
      </div>

      <div aria-hidden className="fx-orb fx-orb--gold w-80 h-80 -left-24 -bottom-10 opacity-40" />
      <div aria-hidden className="fx-orb fx-orb--blue  w-96 h-96 -right-28 -top-10 opacity-40" />
    </section>
  );
}
