"use client";

import { useEffect, useRef } from "react";

type Props = {
  partner?: string | number;   // default: env
  className?: string;
  /** Mantido por compatibilidade; não usado aqui */
  height?: number;
};

// Tipos do SDK Distribusion
interface DistribusionSearch {
  mount(options: {
    root: HTMLElement;
    partnerNumber: number;
    locale?: string;
    language?: string;
    country?: string;
  }): void;
}
interface DistribusionSDK {
  Search?: DistribusionSearch;
}
declare global {
  interface Window {
    Distribusion?: DistribusionSDK;
  }
}

/** Carrega o JS do SDK apenas uma vez (global) */
function ensureScriptOnce(id: string, src: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve();
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "1";
        resolve();
      },
      { once: true }
    );
    document.body.appendChild(script);
  });
}

export default function DistribusionWidgetIframe({
  partner = process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER ?? "814999",
  className = "",
}: Props) {
  // partner como number, com fallback seguro
  const partnerNumber: number = (() => {
    const n = Number(String(partner));
    return Number.isFinite(n) ? n : 814999;
  })();

  // host do Shadow DOM
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // cria shadow root (escopo de estilos)
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });

    // limpa conteúdo anterior do shadow (navegações client-side)
    while (shadow.firstChild) shadow.removeChild(shadow.firstChild);

    // injeta o CSS **dentro** do shadow (não vaza pro header)
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://book.distribusion.com/sdk.1.0.0.css";
    shadow.appendChild(link);

    // container real onde o SDK vai montar
    const root = document.createElement("div");
    root.id = "distribusion-search";
    root.setAttribute("data-locale", "pt-BR");
    root.setAttribute("data-language", "pt-BR");
    root.setAttribute("data-country", "BR");
    shadow.appendChild(root);

    // garante JS do SDK (global)
    ensureScriptOnce("dist-sdk-js", "https://book.distribusion.com/sdk.1.0.0.js").then(() => {
      const sdk = window.Distribusion;
      if (!sdk?.Search?.mount) return;

      sdk.Search.mount({
        root,
        partnerNumber,
        locale: "pt-BR",
        language: "pt-BR",
        country: "BR",
      });
    });

    // cleanup ao desmontar
    return () => {
      while (shadow.firstChild) shadow.removeChild(shadow.firstChild);
    };
  }, [partnerNumber]);

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      {/* O widget vive dentro do Shadow DOM deste host; o CSS não afeta o resto da página */}
      <div ref={hostRef} />
    </div>
  );
}
