"use client";

import { useEffect, useRef, useState } from "react";

export default function DistribusionSDKSearch() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let tries = 0;
    const mount = () => {
      const g = globalThis as unknown as {
        Distribusion?: {
          search: {
            mount: (
              el: HTMLElement,
              opts: {
                host?: string;
                partnerNumber: string | number;
                locale?: string;
                currency?: string;
                layout?: "vertical" | "horizontal";
              }
            ) => void;
          };
        };
      };

      const el = ref.current;
      if (!el) return;

      if (g.Distribusion?.search?.mount) {
        g.Distribusion.search.mount(el, {
          host: "https://book.distribusion.com",
          partnerNumber: process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER ?? "814999",
          locale: "pt-BR",
          currency: "BRL",
          layout: "horizontal",
        });
        setReady(true);
        return;
      }

      if (tries++ < 50) setTimeout(mount, 120); // espera o script carregar
    };
    mount();
  }, []);

  return (
    <div className="relative">
      {!ready && (
        <div className="h-[120px] rounded-xl border border-cloud/70 bg-white/60 animate-pulse" />
      )}
      <div ref={ref} id="distribusion-search" className="w-full" />
    </div>
  );
}
