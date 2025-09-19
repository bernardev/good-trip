"use client";

import { useEffect, useRef } from "react";

type Props = {
  partner?: string | number;   // default: env
  className?: string;
  /** Mantido apenas por compatibilidade; não usado sem iframe */
  height?: number;
};

// Tipos do SDK
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

// Garante CSS apenas uma vez
function ensureCssOnce(id: string, href: string): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

// Carrega o JS do SDK apenas uma vez
function ensureScriptOnce(id: string, src: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve();
      return;
    }
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
  const partnerNumber: number = (() => {
    const raw = String(partner);
    const n = Number(raw);
    return Number.isFinite(n) ? n : 814999;
  })();

  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ensureCssOnce("dist-sdk-css", "https://book.distribusion.com/sdk.1.0.0.css");

    const mount = (): void => {
      const root = rootRef.current;
      const sdk = window.Distribusion;
      if (!root || !sdk?.Search?.mount) return;

      sdk.Search.mount({
        root,
        partnerNumber,
        locale: "pt-BR",
        language: "pt-BR",
        country: "BR",
      });
    };

    ensureScriptOnce("dist-sdk-js", "https://book.distribusion.com/sdk.1.0.0.js")
      .then(mount)
      .catch(() => {
        // opcional: log/telemetria
      });
  }, [partnerNumber]);

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      {/* Sem iframe: o widget cresce normalmente e consegue navegar para book.distribusion.com */}
      <div
        ref={rootRef}
        id="distribusion-search"
        data-locale="pt-BR"
        data-language="pt-BR"
        data-country="BR"
      />
    </div>
  );
}
