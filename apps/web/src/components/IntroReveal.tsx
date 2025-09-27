"use client";

import { useEffect, useState } from "react";

type Props = {
  /** tempo mínimo exibindo o preloader (ms) */
  minTime?: number;
  /** atraso extra além do minTime (ms) — ex.: 1000 ou 2000 */
  extraMs?: number;
  /** frase exibida abaixo do loader */
  text?: string;
};

export default function Preloader({
  minTime = 900,
  extraMs = 500, // +2s por padrão
  text = "Carregando as melhores passagens do Brasil…",
}: Props) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = reduce ? 400 : minTime + extraMs;
    const t = setTimeout(() => setShow(false), total);
    return () => clearTimeout(t);
  }, [minTime, extraMs]);

  if (!show) return null;

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[70] grid place-items-center bg-white"
    >
      <div className="flex flex-col items-center gap-5 px-6">
        {/* Loader azul (usa sua cor 'primary') */}
        <div aria-hidden className="relative h-12 w-12">
          <span className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <span className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin-smooth" />
        </div>

        <p className="text-sm md:text-base text-neutral-700 text-center max-w-[32ch]">
          {text}
        </p>
      </div>

      {/* keyframes locais */}
      <style jsx global>{`
        @keyframes spin-smooth {
          to { transform: rotate(360deg); }
        }
        .animate-spin-smooth {
          animation: spin-smooth 0.9s linear infinite;
        }
      `}</style>
    </div>
  );
}
