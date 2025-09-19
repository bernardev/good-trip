"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Exo_2 } from "next/font/google";

const exo2 = Exo_2({ subsets: ["latin"], weight: ["600", "700"] });

const NAV = [
  { href: "/quem-somos", label: "Quem Somos" },
  { href: "/passagens", label: "Passagens" },
  { href: "/pacotes", label: "Passagens Áereas" },
  { href: "/carros", label: "Contato" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    setMounted(true);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    // ⚠️ wrapper com classe própria para blindar contra CSS do SDK
    <div
      role="banner"
      className="app-header fixed inset-x-0 top-0 h-16 md:h-[72px] border-b border-cloud bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 text-ink"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8 flex h-full items-center justify-between">
        {/* Logo + wordmark */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-goodtrip.jpeg"
            alt="GoodTrip"
            width={216}
            height={78}
            className="h-12 md:h-14 w-auto"
            priority
          />
          <span
            className={`${exo2.className} hidden sm:inline text-navy font-semibold tracking-tight`}
          >
            GoodTrip
          </span>
        </Link>

        {/* Nav Desktop */}
        <nav
          className={`${exo2.className} hidden md:flex items-center gap-6 text-[15px] text-ink/80`}
        >
          {NAV.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="link-underline hover:text-ink transition-colors"
            >
              {i.label}
            </Link>
          ))}
        </nav>

        {/* Ações (desktop) */}
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

        {/* Hamburger (mobile) */}
        <button
          aria-label="Abrir menu"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cloud active:scale-95 transition bg-white"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
      </div>

      {/* === MENU MOBILE VIA PORTAL (fora do fluxo) === */}
      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[2147483647] md:hidden" role="dialog" aria-modal="true">
            {/* fundo sólido para legibilidade */}
            <div
              className="absolute inset-0 bg-white/98 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            {/* conteúdo */}
            <div
              className="absolute inset-0 overflow-y-auto p-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Topbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo-goodtrip.jpeg"
                    alt="GoodTrip"
                    width={168}
                    height={68}
                    className="h-11 w-auto"
                  />
                  <span className={`${exo2.className} font-semibold text-navy`}>GoodTrip</span>
                </div>
                <button
                  aria-label="Fechar menu"
                  className="h-10 w-10 rounded-lg border border-cloud bg-white"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>
              </div>

              {/* Navegação */}
              <nav className={`${exo2.className} mt-6 flex flex-col gap-2`}>
                {NAV.map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    className="rounded-xl px-4 py-4 text-[17px] font-semibold text-ink hover:bg-cloud/40 active:bg-cloud/60 transition"
                    onClick={() => setOpen(false)}
                  >
                    {i.label}
                  </Link>
                ))}
              </nav>

              {/* Ações */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <button className="h-11 rounded-lg border border-cloud bg-white text-ink">
                  PT ▾
                </button>
                <Link
                  href="/login"
                  className="h-11 rounded-lg bg-primary text-white grid place-items-center"
                >
                  Entrar
                </Link>
              </div>

              <p className="mt-6 text-xs text-ink/60">
                © {new Date().getFullYear()} GoodTrip
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
