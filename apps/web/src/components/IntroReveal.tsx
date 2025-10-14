"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** duração mínima visível antes de sumir (ms) */
  durationMs?: number;
  /** duração do fade de saída (ms) */
  fadeOutMs?: number;
  /** mostra apenas uma vez por sessão */
  oncePerSession?: boolean;
  /** storage key para controle da sessão */
  storageKey?: string;
  /** label da marca sob o spinner */
  label?: string;
};

export default function IntroLoaderGT({
  durationMs = 1500,
  fadeOutMs = 400,
  oncePerSession = true,
  storageKey = "goodtrip_intro_seen",
  label = "Carregando as melhores passagens...",
}: Props) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (oncePerSession && typeof window !== "undefined") {
      const seen = sessionStorage.getItem(storageKey);
      if (seen === "1") {
        setVisible(false);
        return;
      }
    }

    hideTimer.current = window.setTimeout(() => {
      setFading(true);
      window.setTimeout(() => {
        setVisible(false);
        if (oncePerSession) sessionStorage.setItem(storageKey, "1");
      }, Math.max(0, fadeOutMs));
    }, Math.max(0, durationMs));

    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [durationMs, fadeOutMs, oncePerSession, storageKey]);

  if (!visible) return null;

  return (
    <section
      className="fixed inset-0 z-[70] overflow-hidden bg-gradient-to-b from-white to-[#f7f9fc] grid place-items-center"
      aria-busy="true"
      aria-live="polite"
      style={{
        opacity: fading ? 0 : 1,
        transition: `opacity ${fadeOutMs}ms ease`,
      }}
    >
      {/* glows nas suas cores */}
      <div aria-hidden className="fx-orb fx-orb--gold w-80 h-80 -left-24 top-10 opacity-40" />
      <div aria-hidden className="fx-orb fx-orb--blue  w-96 h-96 -right-24 -bottom-24 opacity-40" />

      {/* cartão central com mesma estética (gb + shadow-soft + border-cloud) */}
      <div className="spotlight gb p-[2px] rounded-3xl">
        <div className="relative rounded-3xl overflow-hidden bg-white/70 backdrop-blur-xl border border-cloud shadow-soft px-10 py-10 md:py-12 flex flex-col items-center gap-5 min-w-[260px]">
          {/* Spinner nas suas cores: trilha cloud / arco accent */}
          <div className="relative h-16 w-16" aria-hidden="true">
            <svg className="absolute inset-0 h-full w-full text-cloud" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            </svg>
            <svg className="absolute inset-0 h-full w-full animate-spin text-accent" viewBox="0 0 100 100">
              <path d="M50 8 a42 42 0 0 1 0 84" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>

          <div className="text-center select-none">
            <div className="text-xs tracking-wide text-ink/70">Carregando…</div>
            <div className="mt-1 text-lg font-semibold text-navy">{label}</div>
          </div>

          {/* vinheta suave */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
        </div>
      </div>

      {/* respeito a prefers-reduced-motion */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (prefers-reduced-motion: reduce) {
              .animate-spin { animation: none !important; }
            }
          `,
        }}
      />
    </section>
  );
}
