"use client";

import { Exo_2 } from "next/font/google";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import SearchTabs from "@/components/search/SearchTabs";
import { useSettings } from "@/hooks/useSettings";
import type { Banner } from "@/../types/settings";

const exo2 = Exo_2({ subsets: ["latin"], weight: ["700"] });

// util simples p/ limitar números
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

declare global {
  interface Window {
    __gtOpenDeparture?: () => void;
  }
}

export default function Hero() {
  const stars = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  const b: Banner = settings?.banner ?? {};

  // pré-carrega a imagem
  const [bgReady, setBgReady] = useState<boolean>(false);
  useEffect(() => {
    setBgReady(false);
    if (!b.bgUrl) return;
    const img = new Image();
    img.onload = () => setBgReady(true);
    img.onerror = () => setBgReady(false);
    img.src = b.bgUrl;
  }, [b.bgUrl]);

  const hasBg: boolean = Boolean(b.bgUrl) && bgReady;
  const overlay: number = clamp(b.overlay ?? 0.4, 0, 0.9);

  const titleStyle: CSSProperties | undefined = b.textColor ? { color: b.textColor } : undefined;
  const subtitleStyle: CSSProperties | undefined = b.subtitleColor ? { color: b.subtitleColor } : undefined;

  // estrelas
  useEffect(() => {
    const el = stars.current;
    if (!el || el.childElementCount) return;
    for (let i = 0; i < 50; i++) {
      const dot = document.createElement("i");
      dot.style.left = `${Math.random() * 100}%`;
      dot.style.top = `${Math.random() * 100}%`;
      dot.style.animationDelay = `${Math.random() * 2}s`;
      el.appendChild(dot);
    }
  }, []);

  /** FIX: no mobile, 1º toque já abre a lista do campo “De” */
  useEffect(() => {
    const root = searchWrapRef.current;
    if (!root) return;

    const isTouch =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(pointer:coarse)")?.matches || "ontouchstart" in window);

    if (!isTouch) return;

    const handleStart = (_e: Event): void => {
      // chama o abridor do widget (exposto pelo iframe)
      window.__gtOpenDeparture?.();
    };

    root.addEventListener("pointerdown", handleStart as EventListener, { capture: true, passive: true });
    root.addEventListener("touchstart", handleStart as EventListener, { capture: true, passive: true });

    return () => {
      root.removeEventListener("pointerdown", handleStart as EventListener, true);
      root.removeEventListener("touchstart", handleStart as EventListener, true);
    };
  }, []);

  return (
    <section
      className={[
        "relative isolate min-h-[82vh] overflow-hidden",
        hasBg ? "text-white bg-no-repeat bg-cover bg-center" : "text-white bg-gradient-to-br from-navy to-primary",
      ].join(" ")}
      style={hasBg ? { backgroundImage: `url("${b.bgUrl}")` } : undefined}
    >
      {/* overlay só com imagem */}
      {hasBg && (
        <div
          className="absolute inset-0 z-0"
          style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
          aria-hidden
        />
      )}

      {/* ornaments */}
      <div className="fx-orb fx-orb--gold w-80 h-80 -left-24 -top-20 animate-[float_10s_ease-in-out_infinite] -z-10" />
      <div className="fx-orb fx-orb--blue  w-96 h-96 -right-32 -bottom-24 animate-[glow_8s_ease-in-out_infinite] -z-10" />
      <div ref={stars} className="fx-stars -z-10" />
      <div className="fx-grain -z-10" />

      {/* conteúdo */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-24 grid content-center">
        <h1
          className={`${exo2.className} text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight drop-shadow`}
          style={titleStyle}
        >
          {b.title || (
            <>
              Sua viagem de <span className="bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">ônibus</span>, simples e rápida.
            </>
          )}
        </h1>

        <p className="mt-4 max-w-2xl" style={subtitleStyle}>
          {b.subtitle || "Compare horários, preços e rotas. Reserve em poucos cliques."}
        </p>

        {/* Card de busca */}
        <div className="mt-8 md:mt-12 rounded-2xl gb p-[2px]">
          <div
            ref={searchWrapRef}
            className="glass rounded-2xl border border-cloud/80 shadow-soft p-4 md:p-6 backdrop-saturate-150 tilt text-ink"
          >
            <SearchTabs />
          </div>
        </div>

        {/* CTA opcional */}
        {b.ctaLabel && (
          <div className="mt-4">
            <a
              href="#buscar"
              className="inline-grid h-12 px-6 place-items-center rounded-2xl bg-primary text-white font-semibold shadow-soft hover:opacity-95 transition"
            >
              {b.ctaLabel}
            </a>
          </div>
        )}

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
