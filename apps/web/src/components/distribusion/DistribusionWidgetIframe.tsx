"use client";

import { useEffect, useMemo, useRef } from "react";

/* ===== Tipos públicos (props) ===== */
type PrefillOrigin = { lat: number; lng: number; label?: string };
type PrefillDestination = { label: string };

type Props = {
  partner?: string | number;     // default: env
  className?: string;
  height?: number;               // mantido por compatibilidade
  defaultOrigin?: PrefillOrigin;
  defaultDestination?: PrefillDestination;
};

/* ===== Tipos do SDK Distribusion ===== */
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
    script.addEventListener("load", () => {
      script.dataset.loaded = "1";
      resolve();
    }, { once: true });
    document.body.appendChild(script);
  });
}

/** Dispara eventos corretos ao setar valor em inputs */
function setInputValue(el: HTMLInputElement, value: string) {
  const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  if (desc?.set) desc.set.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Heurística para achar os campos "De" e "Para" dentro do container */
function findFromToInputs(container: HTMLElement): { from?: HTMLInputElement; to?: HTMLInputElement } {
  const inputs = Array.from(container.querySelectorAll("input")) as HTMLInputElement[];
  const score = (i: HTMLInputElement) => (i.placeholder || i.ariaLabel || i.name || i.id || "").toLowerCase();
  const from =
    inputs.find((i) => /origem|^de$|de:|from|partida/.test(score(i))) ?? inputs[0];
  const to =
    inputs.find((i) => /destino|^para$|para:|to|chegada/.test(score(i))) ?? inputs[1];
  return { from, to };
}

/** Observa o container até os inputs existirem, então preenche */
function waitAndFill(container: HTMLElement, origin?: PrefillOrigin, destination?: PrefillDestination) {
  let done = false;

  const tryFill = () => {
    const { from, to } = findFromToInputs(container);
    if ((origin?.label && from) || (destination?.label && to)) {
      if (origin?.label && from) setInputValue(from, origin.label);
      if (destination?.label && to) setInputValue(to, destination.label);
      done = true;
      obs.disconnect();
    }
  };

  // 1) tentativa imediata (caso já estejam no DOM)
  tryFill();
  if (done) return;

  // 2) observa por até 3s
  const obs = new MutationObserver(() => tryFill());
  obs.observe(container, { subtree: true, childList: true });
  window.setTimeout(() => {
    if (!done) obs.disconnect();
  }, 3000);
}

export default function DistribusionWidgetIframe({
  partner = process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER ?? "814999",
  className = "",
  defaultOrigin,
  defaultDestination,
}: Props) {
  const partnerNumber: number = useMemo(() => {
    const n = Number(String(partner));
    return Number.isFinite(n) ? n : 814999;
  }, [partner]);

  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Shadow root para isolar estilos do SDK
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    while (shadow.firstChild) shadow.removeChild(shadow.firstChild);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://book.distribusion.com/sdk.1.0.0.css";
    shadow.appendChild(link);

    const root = document.createElement("div");
    root.id = "distribusion-search";
    root.setAttribute("data-locale", "pt-BR");
    root.setAttribute("data-language", "pt-BR");
    root.setAttribute("data-country", "BR");
    shadow.appendChild(root);

    ensureScriptOnce("dist-sdk-js", "https://book.distribusion.com/sdk.1.0.0.js").then(() => {
      const sdk = window.Distribusion;
      const mount = sdk?.Search?.mount;
      if (!mount) return;

      // Prefill via opções do mount (se o SDK respeitar)
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

      // Se o SDK expuser API de atualização pós-mount, usa:
      if (sdk?.Search?.setSearchParams && (defaultOrigin || defaultDestination)) {
        sdk.Search.setSearchParams({
          origin: defaultOrigin
            ? { latitude: defaultOrigin.lat, longitude: defaultOrigin.lng, label: defaultOrigin.label }
            : undefined,
          destination: defaultDestination ? { label: defaultDestination.label } : undefined,
        });
      } else {
        // Fallback: espera inputs e preenche
        window.setTimeout(() => waitAndFill(root, defaultOrigin, defaultDestination), 400);
      }
    });

    return () => {
      while (shadow.firstChild) shadow.removeChild(shadow.firstChild);
    };
  }, [partnerNumber, defaultOrigin, defaultDestination]);

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <div ref={hostRef} />
    </div>
  );
}
