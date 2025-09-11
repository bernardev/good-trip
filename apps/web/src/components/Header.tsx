"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Exo_2 } from "next/font/google";

const exo2 = Exo_2({ subsets: ["latin"], weight: ["600", "700"] });

const NAV = [
  { href: "/passagens", label: "Passagens" },
  { href: "/hospedagens", label: "Hospedagens" },
  { href: "/pacotes", label: "Pacotes" },
  { href: "/carros", label: "Carros" },
  { href: "/eventos", label: "Eventos" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-cloud bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 md:px-8 flex h-16 items-center justify-between">
        {/* Logo + wordmark */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-goodtrip.jpeg"
            alt="GoodTrip"
            width={180}
            height={48}
            className="h-10 md:h-12 w-auto"
            priority
          />
          <span className={`${exo2.className} hidden sm:inline text-navy font-semibold tracking-tight`}>
            GoodTrip
          </span>
        </Link>

        {/* Nav Desktop */}
        <nav className={`${exo2.className} hidden md:flex items-center gap-6 text-[15px] text-ink/80`}>
          {NAV.map((i) => (
            <Link key={i.href} href={i.href} className="link-underline hover:text-ink transition-colors">
              {i.label}
            </Link>
          ))}
        </nav>

        {/* Ações */}
        <div className="hidden md:flex items-center gap-3">
          <button className="rounded-lg border border-cloud px-3 h-9 text-[14px] text-ink/80 hover:bg-cloud/30 transition">
            PT ▾
          </button>
          <Link
            href="/login"
            className="h-9 rounded-lg bg-primary px-4 text-white text-[14px] font-medium shadow-soft transition active:translate-y-[1px]"
          >
            Entrar
          </Link>
        </div>

        {/* Hamburger */}
        <button
          aria-label="Abrir menu"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cloud active:scale-95 transition"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
      </div>

      {/* Drawer Mobile */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] bg-white shadow-xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src="/logo-goodtrip.jpeg" alt="GoodTrip" width={140} height={40} className="h-9 w-auto" />
                <span className={`${exo2.className} font-semibold text-navy`}>GoodTrip</span>
              </div>
              <button
                aria-label="Fechar menu"
                className="h-9 w-9 rounded-lg border border-cloud"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <nav className={`${exo2.className} mt-2 flex flex-col gap-2`}>
              {NAV.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  className="rounded-lg px-3 py-3 text-[16px] text-ink hover:bg-cloud/30 transition"
                  onClick={() => setOpen(false)}
                >
                  {i.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto pt-4 border-t border-cloud">
              <div className="flex gap-2">
                <button className="flex-1 rounded-lg border border-cloud px-3 h-10">PT ▾</button>
                <Link href="/login" className="flex-1 h-10 rounded-lg bg-primary text-white grid place-items-center">
                  Entrar
                </Link>
              </div>
              <p className="mt-3 text-xs text-ink/60">© {new Date().getFullYear()} GoodTrip</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
