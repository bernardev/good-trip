"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Exo_2 } from "next/font/google";
const exo2 = Exo_2({ subsets: ["latin"], weight: ["700"] });

export default function IntroReveal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const played = sessionStorage.getItem("introPlayed"); // toque uma vez por aba
    if (reduce || played) return;
    setShow(true);
    const t = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("introPlayed", "1");
    }, 1750);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div aria-hidden className="fixed inset-0 z-[70] overflow-hidden">
      {/* fundo gradiente + fade */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy to-primary animate-introFade" />
      {/* logo + wordmark */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="intro-card text-center">
          <Image
            src="/logo-goodtrip.jpeg"
            alt=""
            width={240}
            height={64}
            className="h-12 md:h-14 w-auto drop-shadow"
            priority
          />
          <div className={`${exo2.className} mt-2 text-white/90 text-xl md:text-2xl font-bold tracking-tight`}>
            GoodTrip
          </div>
        </div>
      </div>
      {/* wipe dourado */}
      <div className="intro-wipe" />
    </div>
  );
}
