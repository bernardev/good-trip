"use client";

import { useEffect, useRef, useState } from "react";

// Tipagem mínima do SDK (o script injeta isso em window)
interface DistribusionSearchMountOpts {
  root: HTMLElement;
  partnerNumber: string | number;
  locale?: string;
  currency?: string;
  layout?: "vertical" | "horizontal";
  defaults?: Record<string, unknown>;
  utm?: Record<string, string>;
}
interface DistribusionSearch {
  mount: (opts: DistribusionSearchMountOpts) => void;
}
interface DistribusionSDK {
  Search?: DistribusionSearch;
}

declare global {
  // estende o window para o TypeScript saber do SDK
  interface Window {
    Distribusion?: DistribusionSDK;
  }
}

export default function DistribusionSDKSearch() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let tries = 0;

    const mount = () => {
      const el = ref.current;
      const mountFn = window.Distribusion?.Search?.mount;

      if (el && typeof mountFn === "function") {
        mountFn({
          root: el,
          partnerNumber: process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER ?? "814999",
          locale: "pt",
          currency: "BRL",
          // layout: "horizontal", // habilite se quiser forçar
        });
        setReady(true);
        return;
      }

      if (tries++ < 60) setTimeout(mount, 120); // aguarda o script carregar
    };

    mount();
  }, []);

  return (
    <div className="relative">
      {!ready && (
        <div className="h-[130px] rounded-xl border border-cloud/70 bg-white/60 animate-pulse" />
      )}
      <div ref={ref} id="distribusion-search" className="w-full" />
    </div>
  );
}
