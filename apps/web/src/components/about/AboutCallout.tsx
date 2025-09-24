"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Exo_2 } from "next/font/google";
import QuemSomosImg from "@/components/quem-somos.png"; // sua imagem

const exo2 = Exo_2({ subsets: ["latin"], weight: ["700"] });

export default function AboutCallout() {
  const boxRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // Spotlight segue mouse/toque (sem any)
  const onMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    const el = boxRef.current;
    if (!el) return;

    const point = "touches" in e ? e.touches[0] : e;
    const rect = el.getBoundingClientRect();
    const x = ((point.clientX - rect.left) / rect.width) * 100;
    const y = ((point.clientY - rect.top) / rect.height) * 100;

    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  };

  const onLeave = () => {
    const el = boxRef.current;
    if (!el) return;
    el.style.removeProperty("--mx");
    el.style.removeProperty("--my");
  };

  // Animação quando a seção entra na viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((it) => it.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-b from-white to-[#f7f9fc]"
    >
      {/* glows de fundo */}
      <div aria-hidden className="fx-orb fx-orb--gold w-72 h-72 -left-24 top-10 opacity-40" />
      <div aria-hidden className="fx-orb fx-orb--blue  w-80 h-80 -right-24 -bottom-20 opacity-40" />

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-20">
        <div
          ref={boxRef}
          onMouseMove={onMove}
          onTouchMove={onMove}
          onMouseLeave={onLeave}
          className={`spotlight rounded-3xl gb p-[2px] ${
            inView ? "animate-fade-up" : "opacity-0 translate-y-2"
          }`}
          style={inView ? { animationDelay: ".04s" } : undefined}
        >
          <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-cloud shadow-soft px-6 py-10 md:p-14 flex flex-col md:flex-row items-center gap-10">
            {/* Texto */}
            <div className="w-full md:w-1/2">
              <h2
                className={`${exo2.className} text-3xl md:text-5xl font-extrabold tracking-tight text-navy`}
              >
                Por trás da viagem, <span className="text-accent">pessoas</span>.
              </h2>

              <p className="mt-4 text-ink/75 max-w-prose">
                Somos apaixonados por colocar você no destino certo. Tecnologia,
                parceria e atendimento humano para transformar cada rota em uma
                boa história.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs text-ink/70">
                <span className="rounded-full bg-cloud/60 px-3 py-1">
                  +120 parceiros
                </span>
                <span className="rounded-full bg-cloud/60 px-3 py-1">
                  Cobertura nacional
                </span>
                <span className="rounded-full bg-cloud/60 px-3 py-1">
                  Suporte 24/7
                </span>
              </div>

              {/* Botões */}
              <div className="mt-7 flex flex-col sm:flex-row gap-3 w-full">
                <Link
                  href="/quem-somos"
                  aria-label="Conheça a GoodTrip"
                  className="btn-cta inline-flex h-12 items-center justify-center rounded-2xl bg-accent text-ink font-semibold tracking-wide text-sm whitespace-nowrap px-5 md:px-7 transition duration-300 hover:bg-primary hover:text-white active:translate-y-[1px] w-full sm:w-auto"
                  style={inView ? { animation: "fade-up .5s ease both", animationDelay: ".12s" } : undefined}
                >
                  Conheça a GoodTrip
                </Link>

                <Link
                  href="/contato"
                  aria-label="Fale com a gente"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-cloud bg-white text-ink tracking-wide text-sm whitespace-nowrap px-5 md:px-7 transition duration-300 hover:bg-cloud/40 active:translate-y-[1px] w-full sm:w-auto"
                  style={inView ? { animation: "fade-up .5s ease both", animationDelay: ".18s" } : undefined}
                >
                  Fale com a gente
                </Link>
              </div>
            </div>

            {/* Visual com imagem */}
            <div className="relative w-full md:w-1/2 grid place-items-center">
              <div
                className="relative w-[min(520px,94%)] aspect-[16/11] rounded-3xl overflow-hidden gb shadow-soft"
                style={
                  inView
                    ? { animation: "fade-up .5s ease both", animationDelay: ".14s" }
                    : undefined
                }
              >
                <Image
                  src={QuemSomosImg}
                  alt="Quem somos — equipe GoodTrip"
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 520px, 90vw"
                  priority
                />
                {/* vinheta sutil para legibilidade */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
