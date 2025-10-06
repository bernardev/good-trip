"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Exo_2 } from "next/font/google";
import { useSettings } from "@/hooks/useSettings";
import type { Header as HeaderCfg, HeaderLink } from "@/../types/settings";
import { DEFAULT_HEADER_PRESET } from "@/../types/settings";
import { useSession, signOut } from "next-auth/react";
import DistribusionWidgetIframe from "@/components/distribusion/DistribusionWidgetIframe";

const exo2 = Exo_2({ subsets: ["latin"], weight: ["600", "700"] });

const NAV_FALLBACK: ReadonlyArray<HeaderLink> = DEFAULT_HEADER_PRESET.nav ?? [];

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

export default function Header() {
  const [openMenu, setOpenMenu] = useState(false);
  const [openWidget, setOpenWidget] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { settings } = useSettings();
  const cfg: HeaderCfg | undefined = settings?.header;

  const nav: ReadonlyArray<HeaderLink> =
    cfg?.nav && cfg.nav.length > 0 ? cfg.nav : NAV_FALLBACK;

  // CTA público abre modal do Distribusion (ignora href)
  const ctaLabel: string =
    cfg?.ctaLabel ?? DEFAULT_HEADER_PRESET.ctaLabel ?? "Buscar agora";

  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const adminName = session?.user?.name ?? "Admin";

  // ESC fecha menu/modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(false);
        setOpenWidget(false);
      }
    };
    window.addEventListener("keydown", onKey);
    setMounted(true);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // trava scroll se menu ou widget estiverem abertos
  useEffect(() => {
    const anyOpen = openMenu || openWidget;
    const prev = document.body.style.overflow;
    document.body.style.overflow = anyOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openMenu, openWidget]);

  return (
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
          <span className={`${exo2.className} hidden sm:inline text-navy font-semibold tracking-tight`}>
            GoodTrip
          </span>
          {isAuthed && (
            <span className="ml-2 hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {adminName} (Admin)
            </span>
          )}
        </Link>

        {/* Nav Desktop */}
        <nav className={`${exo2.className} hidden md:flex items-center gap-6 text-[15px] text-ink/80`}>
          {nav.map((i) => {
            const external = isExternal(i.href);
            return external ? (
              <a
                key={i.href}
                href={i.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline hover:text-ink transition-colors"
              >
                {i.label}
              </a>
            ) : (
              <Link key={i.href} href={i.href} className="link-underline hover:text-ink transition-colors">
                {i.label}
              </Link>
            );
          })}
        </nav>

        {/* Ações (desktop) — CTA abre modal do Distribusion */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthed ? (
            <>
              <Link
                href="/admin"
                className="h-11 rounded-lg border border-cloud bg-white text-ink px-4 inline-flex items-center justify-center"
              >
                Painel
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="h-11 rounded-lg bg-primary text-white px-4 inline-flex items-center justify-center"
              >
                Sair
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setOpenWidget(true)}
              className="h-11 rounded-lg bg-primary text-white px-4 inline-flex items-center justify-center"
              aria-haspopup="dialog"
              aria-controls="header-widget"
            >
              {ctaLabel}
            </button>
          )}
        </div>

        {/* Hamburger (mobile) */}
        <button
          aria-label="Abrir menu"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cloud active:scale-95 transition bg-white"
          onClick={() => setOpenMenu(true)}
        >
          ☰
        </button>
      </div>

      {/* ===== MODAL DO DISTRIBUSION (desktop + mobile) ===== */}
      {mounted && openWidget &&
        createPortal(
          <div
            id="header-widget"
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[2147483000] flex items-end sm:items-center justify-center"
          >
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
              onClick={() => setOpenWidget(false)}
            />
            {/* sheet/modal */}
            <div className="relative w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-cloud mx-auto sm:mx-4 overflow-hidden">
              {/* header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-cloud/70 bg-white">
                <div className="min-w-0">
                  <p className="text-xs text-ink/60 leading-none">Reservar viagem</p>
                  <h3 className="text-base sm:text-lg font-semibold text-navy truncate">Buscar viagens</h3>
                </div>
                <button
                  onClick={() => setOpenWidget(false)}
                  className="rounded-lg border border-cloud px-3 py-1.5 text-sm hover:bg-cloud/50"
                  aria-label="Fechar"
                >
                  Fechar
                </button>
              </div>

              {/* conteúdo: widget */}
              <div className="p-3 sm:p-4">
                <div className="rounded-xl border border-cloud bg-white/70 p-3 sm:p-4 shadow-soft">
                  <DistribusionWidgetIframe className="w-full" />
                </div>
                <p className="mt-3 text-[11px] sm:text-xs text-ink/60">
                  Preencha origem e data para buscar horários e preços.
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ===== MENU MOBILE VIA PORTAL ===== */}
      {mounted && openMenu &&
        createPortal(
          <div className="fixed inset-0 z-[2147483647] md:hidden" role="dialog" aria-modal="true">
            {/* fundo */}
            <div className="absolute inset-0 bg-white/98 backdrop-blur-sm" onClick={() => setOpenMenu(false)} />
            {/* conteúdo */}
            <div className="absolute inset-0 overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
              {/* Topbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image src="/logo-goodtrip.jpeg" alt="GoodTrip" width={168} height={68} className="h-11 w-auto" />
                  <span className={`${exo2.className} font-semibold text-navy`}>GoodTrip</span>
                </div>
                <button
                  aria-label="Fechar menu"
                  className="h-10 w-10 rounded-lg border border-cloud bg-white"
                  onClick={() => setOpenMenu(false)}
                >
                  ✕
                </button>
              </div>

              {/* Navegação */}
              <nav className={`${exo2.className} mt-6 flex flex-col gap-2`}>
                {nav.map((i) => {
                  const external = isExternal(i.href);
                  return external ? (
                    <a
                      key={i.href}
                      href={i.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl px-4 py-4 text-[17px] font-semibold text-ink hover:bg-cloud/40 active:bg-cloud/60 transition"
                      onClick={() => setOpenMenu(false)}
                    >
                      {i.label}
                    </a>
                  ) : (
                    <Link
                      key={i.href}
                      href={i.href}
                      className="rounded-xl px-4 py-4 text-[17px] font-semibold text-ink hover:bg-cloud/40 active:bg-cloud/60 transition"
                      onClick={() => setOpenMenu(false)}
                    >
                      {i.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Ações */}
              <div className="mt-8 grid grid-cols-1 gap-3">
                {isAuthed ? (
                  <>
                    <Link
                      href="/admin"
                      className="h-11 rounded-lg border border-cloud bg-white text-ink grid place-items-center"
                      onClick={() => setOpenMenu(false)}
                    >
                      Painel
                    </Link>
                    <button
                      className="h-11 rounded-lg bg-primary text-white"
                      onClick={() => {
                        setOpenMenu(false);
                        signOut({ callbackUrl: "/login" });
                      }}
                    >
                      Sair
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="h-11 rounded-lg bg-primary text-white grid place-items-center"
                    onClick={() => {
                      setOpenMenu(false);
                      setOpenWidget(true);
                    }}
                    aria-haspopup="dialog"
                    aria-controls="header-widget"
                  >
                    {ctaLabel}
                  </button>
                )}
              </div>

              {isAuthed && (
                <p className="mt-6 text-xs text-ink/60">Logado como {adminName}</p>
              )}
              <p className="mt-2 text-xs text-ink/60">© {new Date().getFullYear()} GoodTrip</p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}