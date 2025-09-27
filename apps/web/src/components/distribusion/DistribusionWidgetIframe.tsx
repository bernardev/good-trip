"use client";

import { useEffect, useMemo, useRef } from "react";

/* ===== Props públicas ===== */
type PrefillOrigin = { lat: number; lng: number; label?: string };
type PrefillDestination = { label: string };

type Props = {
  partner?: string | number; // default: env
  className?: string;
  height?: number; // mantido por compat
  defaultOrigin?: PrefillOrigin;
  defaultDestination?: PrefillDestination;
};

/* ===== Tipos do SDK Distribusion (inferidos pela doc) ===== */
interface DistribusionSearchMountOpts {
  root: HTMLElement;
  partnerNumber: number;
  locale?: string;
  language?: string;
  country?: string;
  origin_latitude?: number;
  origin_longitude?: number;
  origin_label?: string;
  destination_label?: string;
}
interface DistribusionSearch {
  mount(options: DistribusionSearchMountOpts): void;
  setSearchParams?(params: {
    origin?: { latitude: number; longitude: number; label?: string };
    destination?: { label: string };
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

/* ===== Util: carregar script uma vez ===== */
function ensureScriptOnce(id: string, src: string): Promise<void> {
  return new Promise<void>((resolve) => {
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

/* ===== Util: setar valor em input disparando eventos corretos ===== */
function setInputValue(el: HTMLInputElement, value: string): void {
  const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  if (desc?.set) desc.set.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/* ===== Heurística para localizar inputs "De" e "Para" ===== */
function findFromToInputs(container: HTMLElement): {
  from?: HTMLInputElement;
  to?: HTMLInputElement;
} {
  const inputs = Array.from(container.querySelectorAll("input")) as HTMLInputElement[];
  const score = (i: HTMLInputElement): string =>
    (i.placeholder || i.ariaLabel || i.name || i.id || "").toLowerCase();

  const from =
    inputs.find((i) => /(^de$|de:|origem|from|partida)/.test(score(i))) ?? inputs[0];
  const to =
    inputs.find((i) => /(^para$|para:|destino|to|chegada)/.test(score(i))) ?? inputs[1];

  return { from, to };
}

/* ===== Espera inputs e faz prefill (fallback) ===== */
function waitAndFill(
  container: HTMLElement,
  origin?: PrefillOrigin,
  destination?: PrefillDestination
): void {
  let done = false;

  const tryFill = (): void => {
    const { from, to } = findFromToInputs(container);
    if ((origin?.label && from) || (destination?.label && to)) {
      if (origin?.label && from) setInputValue(from, origin.label);
      if (destination?.label && to) setInputValue(to, destination.label);
      done = true;
      obs.disconnect();
    }
  };

  // tentativa imediata
  tryFill();
  if (done) return;

  // observar por até 3s
  const obs = new MutationObserver(() => tryFill());
  obs.observe(container, { subtree: true, childList: true });
  window.setTimeout(() => {
    if (!done) obs.disconnect();
  }, 3000);
}

/* ===== Mapa fraco para cleanup sem usar `any` ===== */
const cleanupMap = new WeakMap<HTMLElement, () => void>();

export default function DistribusionWidgetIframe({
  partner = process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER ?? "814999",
  className = "",
  defaultOrigin,
  defaultDestination,
}: Props) {
  const partnerNumber = useMemo<number>(() => {
    const n = Number(String(partner));
    return Number.isFinite(n) ? n : 814999;
  }, [partner]);

  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // ShadowRoot para isolar estilos do SDK
    const shadow: ShadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    while (shadow.firstChild) shadow.removeChild(shadow.firstChild);

    // CSS do SDK
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://book.distribusion.com/sdk.1.0.0.css";
    shadow.appendChild(link);

    // Root onde o SDK monta
    const root = document.createElement("div");
    root.id = "distribusion-search";
    root.setAttribute("data-locale", "pt-BR");
    root.setAttribute("data-language", "pt-BR");
    root.setAttribute("data-country", "BR");
    shadow.appendChild(root);

    // carregar SDK
    ensureScriptOnce("dist-sdk-js", "https://book.distribusion.com/sdk.1.0.0.js").then(() => {
      const sdk = window.Distribusion;
      const mount = sdk?.Search?.mount;
      if (!mount) return;

      const opts: DistribusionSearchMountOpts = {
        root,
        partnerNumber,
        locale: "pt-BR",
        language: "pt-BR",
        country: "BR",
      };

      if (defaultOrigin) {
        opts.origin_latitude = defaultOrigin.lat;
        opts.origin_longitude = defaultOrigin.lng;
        if (defaultOrigin.label) opts.origin_label = defaultOrigin.label;
      }
      if (defaultDestination?.label) {
        opts.destination_label = defaultDestination.label;
      }

      mount(opts);

      // Prefill via API (se disponível); senão, fallback
      if (sdk?.Search?.setSearchParams && (defaultOrigin || defaultDestination)) {
        sdk.Search.setSearchParams({
          origin: defaultOrigin
            ? {
                latitude: defaultOrigin.lat,
                longitude: defaultOrigin.lng,
                label: defaultOrigin.label,
              }
            : undefined,
          destination: defaultDestination ? { label: defaultDestination.label } : undefined,
        });
      } else {
        window.setTimeout(() => waitAndFill(root, defaultOrigin, defaultDestination), 400);
      }

      /* ===== FIX MOBILE: 1º toque abre lista de "Destinos Populares" ===== */
      const isTouch =
        typeof window !== "undefined" &&
        (window.matchMedia?.("(pointer:coarse)")?.matches || "ontouchstart" in window);

      let detach: (() => void) | undefined;

      if (isTouch) {
        const openPopular = (): void => {
          const { from } = findFromToInputs(root);
          if (!from) return;
          // foco em tick seguinte (iOS-friendly)
          window.setTimeout(() => {
            try {
              from.focus({ preventScroll: true });
            } catch {
              /* noop */
            }
            from.click();
            from.dispatchEvent(new Event("focus", { bubbles: true }));
            from.dispatchEvent(new Event("input", { bubbles: true }));
          }, 0);
        };

        const onPointerDownCapture = (e: Event): void => {
          const t = e.target as Element | null;
          if (!t) return;
          if (t.closest("input, button, [role='combobox'], select, textarea")) return;
          openPopular();
        };

        const onFocusIn = (e: FocusEvent): void => {
          const el = e.target as HTMLElement | null;
          if (el?.tagName === "INPUT") {
            const input = el as HTMLInputElement;
            if (!input.value) {
              input.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }
        };

        root.addEventListener("pointerdown", onPointerDownCapture, {
          passive: true,
          capture: true,
        });
        root.addEventListener("focusin", onFocusIn);

        detach = () => {
          root.removeEventListener("pointerdown", onPointerDownCapture, true);
          root.removeEventListener("focusin", onFocusIn);
        };
      }

      if (detach) cleanupMap.set(host, detach);
      /* ===== /FIX MOBILE ===== */
    });

    // cleanup
    return () => {
      const detach = cleanupMap.get(host);
      if (detach) detach();
      while (shadow.firstChild) shadow.removeChild(shadow.firstChild);
    };
  }, [partnerNumber, defaultOrigin, defaultDestination]);

  return (
    <div className={`rounded-xl overflow-hidden ${className ?? ""}`}>
      <div ref={hostRef} />
    </div>
  );
}
