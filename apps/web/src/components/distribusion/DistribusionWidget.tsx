"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

type Props = {
  /** URL do script do widget segundo a doc da Distribusion */
  scriptSrc?: string;
  /** Idioma */
  locale?: string;
  className?: string;
};

/**
 * Embeda o widget de busca da Distribusion.
 * Se a doc te der outra URL, ajuste `scriptSrc`.
 */
export default function DistribusionWidget({
  scriptSrc = "https://widgets.distribusion.com/search-widget/v1.js",
  locale = "pt-BR",
  className = "",
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Se o script fizer auto-initialize por data-attributes, não precisamos fazer nada aqui.
    // Mantemos os data-* no container abaixo.
  }, []);

  return (
    <div className={className}>
      {/* Carrega o script do widget após interativo */}
      <Script src={scriptSrc} strategy="afterInteractive" />

      {/* Container lido pelo script (data-attributes) */}
      <div
        ref={mountRef}
        id="distribusion-search-widget"
        className="w-full"
        data-partner-number={process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER}
        data-locale={locale}
        // Exemplos extras (habilite se a doc mencionar):
        // data-product="bus"
        // data-theme-primary="#2c74e4"
        // data-theme-accent="#dfbc68"
      />
    </div>
  );
}
