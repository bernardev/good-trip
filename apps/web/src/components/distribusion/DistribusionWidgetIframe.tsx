"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  partner?: string | number;
  className?: string;
  /** Altura inicial provisória */
  height?: number;
  /** Margem anti-corte em px (soma na altura medida) */
  extraPadding?: number;
};

export default function DistribusionWidgetIframe({
  partner = process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER ?? "814999",
  className = "",
  height = 300,
  extraPadding = 24,
}: Props) {
  const partnerNum: number =
    Number(partner) ||
    Number(process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER) ||
    814999;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(height);
  const [loaded, setLoaded] = useState<boolean>(false);

  const html: string = useMemo(
    () =>
      `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Language" content="pt-BR" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link href="https://book.distribusion.com/sdk.1.0.0.css" rel="stylesheet" />
    <style>
      html,body{margin:0;padding:0;background:transparent;overflow:hidden}
      #distribusion-search{margin:0;padding:0}
    </style>
  </head>
  <body>
    <div id="distribusion-search" data-locale="pt-BR" data-language="pt-BR" data-country="BR"></div>
    <script src="https://book.distribusion.com/sdk.1.0.0.js"></script>
    <script>
      (function mount(){
        if (window.Distribusion && window.Distribusion.Search && typeof window.Distribusion.Search.mount === 'function') {
          window.Distribusion.Search.mount({
            root: document.getElementById('distribusion-search'),
            partnerNumber: ${partnerNum},
            locale: 'pt-BR',
            language: 'pt-BR',
            country: 'BR'
          });
        } else {
          window.addEventListener('load', mount);
        }
      })();
    </script>
  </body>
</html>`.trim(),
    [partnerNum]
  );

  useEffect(() => {
    if (!loaded || !iframeRef.current) return;

    const iframeEl = iframeRef.current;
    const doc: Document | null =
      iframeEl.contentDocument ?? iframeEl.contentWindow?.document ?? null;
    if (!doc) return;

    const measure = (): void => {
      const root = doc.documentElement;
      const body = doc.body;
      const heights: number[] = [
        root?.scrollHeight ?? 0,
        body?.scrollHeight ?? 0,
        root?.offsetHeight ?? 0,
        body?.offsetHeight ?? 0,
        root?.clientHeight ?? 0,
        body?.clientHeight ?? 0,
      ];
      const h = Math.max(...heights);
      const newH = Math.max(220, Math.ceil(h + extraPadding));
      setIframeHeight((prev) => (Math.abs(prev - newH) > 2 ? newH : prev));
    };

    // medição inicial
    measure();

    // ResizeObserver (sempre do parent window)
    const ro = new ResizeObserver(() => measure());
    ro.observe(doc.documentElement);
    if (doc.body) ro.observe(doc.body);

    // MutationObserver para expansões do DOM dentro do iframe
    const mo = new MutationObserver(() => measure());
    mo.observe(doc.documentElement, { childList: true, subtree: true, attributes: true });

    // timers para mudanças tardias do SDK
    const t1: number = window.setInterval(measure, 150);
    const stopT1: number = window.setTimeout(() => window.clearInterval(t1), 2500);
    const t2: number = window.setInterval(measure, 500);
    const stopT2: number = window.setTimeout(() => window.clearInterval(t2), 10000);

    // quando o iframe (elemento) mudar de largura, re-medir
    const parentRO = new ResizeObserver(() => measure());
    parentRO.observe(iframeEl);

    return () => {
      ro.disconnect();
      mo.disconnect();
      parentRO.disconnect();
      window.clearInterval(t1);
      window.clearInterval(t2);
      window.clearTimeout(stopT1);
      window.clearTimeout(stopT2);
    };
  }, [loaded, extraPadding]);

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <iframe
        ref={iframeRef}
        title="Busca de ônibus — Distribusion"
        srcDoc={html}
        onLoad={(): void => setLoaded(true)}
        style={{ width: "100%", height: iframeHeight, border: 0, background: "transparent" }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
