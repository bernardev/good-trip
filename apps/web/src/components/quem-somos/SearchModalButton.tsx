"use client";

import { useEffect, useState } from "react";
import DistribusionWidgetIframe from "@/components/distribusion/DistribusionWidgetIframe";

export default function SearchModalButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  // trava scroll quando o modal está aberto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-2xl bg-primary text-white px-6 h-12 grid place-items-center font-semibold shadow-soft hover:opacity-95 transition active:translate-y-[1px] ${className}`}
        aria-haspopup="dialog"
        aria-controls="about-widget"
      >
        Comece sua busca agora
      </button>

      {open && (
        <div
          id="about-widget"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center"
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" onClick={() => setOpen(false)} />

          {/* sheet/modal */}
          <div className="relative w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-cloud mx-auto sm:mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-cloud/70 bg-white">
              <div className="min-w-0">
                <p className="text-xs text-ink/60 leading-none">Reservar viagem</p>
                <h3 className="text-base sm:text-lg font-semibold text-navy truncate">Buscar viagens</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-cloud px-3 py-1.5 text-sm hover:bg-cloud/50"
                aria-label="Fechar"
              >
                Fechar
              </button>
            </div>

            <div className="p-3 sm:p-4">
              <div className="rounded-xl border border-cloud bg-white/70 p-3 sm:p-4 shadow-soft">
                <DistribusionWidgetIframe className="w-full" />
              </div>
              <p className="mt-3 text-[11px] sm:text-xs text-ink/60">
                Preencha origem e data para buscar horários e preços.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
