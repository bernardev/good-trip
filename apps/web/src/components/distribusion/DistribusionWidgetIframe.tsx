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

/* ===== Utils ===== */

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

function setInputValue(el: HTMLInputElement, value: string) {
  const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  if (desc?.set) desc.set.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function findFromToInputs(container: HTMLElement): { from?: HTMLInputElement; to?: HTMLInputElement } {
  const inputs = Array.from(container.querySelectorAll("input")) as HTMLInputElement[];
  const score = (i: HTMLInputElement) =>
    (i.placeholder || i.getAttribute("aria-label") || i.name || i.id || "").toLowerCase();
  const from = inputs.find((i) => /(^|\s)(origem|de|from|partida)(:|\s|$)/.test(score(i))) ?? inputs[0];
  const to = inputs.find((i) => /(^|\s)(destino|para|to|chegada)(:|\s|$)/.test(score(i))) ?? inputs[1];
  return { from, to };
}

function composedPathSafe(e: Event): EventTarget[] {
  const withPath = e as Event & { composedPath?: () => EventTarget[] };
  return typeof withPath.composedPath === "function" ? withPath.composedPath() : [e.target as EventTarget];
}

/* ===== Correção: marcar alvo do toque e autofocus no modal ===== */

/** Registra qual campo foi tocado (“departure” | “arrival”). */
function installTapTargetTracker(root: HTMLElement, lastTapRef: { current: "departure" | "arrival" | null }): () => void {
  const capture = true;

  const markFromOrTo = (e: MouseEvent | TouchEvent) => {
    const path = composedPathSafe(e);
    const node = (path[0] as Node) ?? (e.target as Node | null);
    if (!node) return;

    // Anchors no DOM interno
    const depWrap = root.querySelector('[data-tag="departure-wrapper"]');
    const arrWrap = root.querySelector('[data-tag="arrival-wrapper"]');
    const depInput = root.querySelector('input[data-tag="departure"]');
    const arrInput = root.querySelector('input[data-tag="arrival"]');

    const hitDeparture =
      (!!depWrap && node instanceof Node && depWrap.contains(node)) ||
      (!!depInput && node instanceof Node && depInput.contains(node));
    const hitArrival =
      (!!arrWrap && node instanceof Node && arrWrap.contains(node)) ||
      (!!arrInput && node instanceof Node && arrInput.contains(node));

    if (hitDeparture) lastTapRef.current = "departure";
    else if (hitArrival) lastTapRef.current = "arrival";
    // se não identificou, deixa como está (usaremos fallback depois)
  };

  root.addEventListener("touchend", markFromOrTo as EventListener, { capture, passive: true });
  root.addEventListener("click", markFromOrTo as EventListener, { capture });

  return () => {
    root.removeEventListener("touchend", markFromOrTo as EventListener, { capture } as AddEventListenerOptions);
    root.removeEventListener("click", markFromOrTo as EventListener, { capture } as AddEventListenerOptions);
  };
}

/** Observa o Shadow/Root; ao abrir o modal, foca/clica o input correspondente. */
function installModalAutofocus(
  shadow: ShadowRoot,
  lastTapRef: { current: "departure" | "arrival" | null }
): MutationObserver {
  const obs = new MutationObserver(() => {
    // Modal completo (full-screen) do SDK
    const modal =
      shadow.querySelector(".ui-modal__full-screen, [data-tag='modal-window']") as HTMLElement | null;
    if (!modal) return;

    const which: "departure" | "arrival" =
      lastTapRef.current ?? "departure"; // fallback seguro

    // Seleciona o input correto DENTRO do modal
    const input =
      (modal.querySelector(`input[data-tag="${which}"]`) as HTMLInputElement | null) ||
      (modal.querySelector(`[data-tag="${which}-wrapper"] input`) as HTMLInputElement | null) ||
      null;

    if (input) {
      // Foca e clica no próximo micro-tick para garantir que o SDK já anexou handlers
      queueMicrotask(() => {
        try {
          input.focus({ preventScroll: true });
          const ev = new MouseEvent("click", { bubbles: true, cancelable: true, view: window });
          input.dispatchEvent(ev);
        } catch {
          input.click();
        }
      });

      // Depois de focar uma vez, podemos limpar a intenção (evita reaplicar)
      lastTapRef.current = null;
      // e não precisamos observar mais mudanças por enquanto
      // (se preferir reaplicar sempre, remova a linha abaixo)
      // obs.disconnect();  // opcional
    }
  });

  obs.observe(shadow, { subtree: true, childList: true });
  return obs;
}

/* ===== Observa o container até os inputs existirem, então preenche ===== */
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

  tryFill();
  if (done) return;

  const obs = new MutationObserver(() => tryFill());
  obs.observe(container, { subtree: true, childList: true });
  window.setTimeout(() => {
    if (!done) obs.disconnect();
  }, 3000);
}

/* ===== Componente ===== */

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

    // CSS do SDK
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://book.distribusion.com/sdk.1.0.0.css";
    shadow.appendChild(link);

    // Raiz do widget
    const root = document.createElement("div");
    root.id = "distribusion-search";
    root.setAttribute("data-locale", "pt-BR");
    root.setAttribute("data-language", "pt-BR");
    root.setAttribute("data-country", "BR");
    shadow.appendChild(root);

    // Estado: qual campo o usuário tocou por último
    const lastTapRef: { current: "departure" | "arrival" | null } = { current: null };

    // Track do alvo do toque (antes do SDK)
    const removeTapTracker = installTapTargetTracker(root, lastTapRef);

    // Loader e montagem
    let modalObserver: MutationObserver | null = null;

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

      // Observa o modal e aplica autofocus no input correto
      modalObserver = installModalAutofocus(shadow, lastTapRef);

      // API pós-mount (quando disponível)
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
      removeTapTracker();
      modalObserver?.disconnect();
      while (shadow.firstChild) shadow.removeChild(shadow.firstChild);
    };
  }, [partnerNumber, defaultOrigin, defaultDestination]);

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <div ref={hostRef} />
    </div>
  );
}
