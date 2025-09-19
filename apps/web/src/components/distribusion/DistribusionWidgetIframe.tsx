"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  partner?: string | number;
  className?: string;
  height?: number; // altura inicial provisória
  extraPadding?: number; // margem anti-corte
};

export default function DistribusionWidgetIframe({
  partner = process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER ?? "814999",
  className = "",
  height = 280,
  extraPadding = 32, // evita “cortar” 1–2 linhas no final
}: Props) {
  const partnerNum =
    Number(partner) ||
    Number(process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER) ||
    814999;

  const frameId = useRef(`dist-${Math.random().toString(36).slice(2)}`).current;
  const [iframeHeight, setIframeHeight] = useState<number>(height);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const html = useMemo(
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
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial}
      #distribusion-search{margin:0;padding:0}
    </style>
  </head>
  <body>
    <div id="distribusion-search"
         data-locale="pt-BR"
         data-language="pt-BR"
         data-country="BR"></div>

    <script src="https://book.distribusion.com/sdk.1.0.0.js"></script>
    <script>
      (function(){
        var ROOT = document.getElementById('distribusion-search');

        function measure() {
          // mede de várias formas e pega o maior
          var docEl = document.documentElement;
          var body = document.body || docEl;
          var rootBox = ROOT ? ROOT.getBoundingClientRect() : {height:0};
          var h = Math.max(
            docEl.scrollHeight || 0,
            body.scrollHeight || 0,
            docEl.offsetHeight || 0,
            body.offsetHeight || 0,
            docEl.clientHeight || 0,
            body.clientHeight || 0,
            Math.ceil(rootBox.height) || 0
          );
          // envia ao parent
          try {
            parent.postMessage({ type: 'distribusion-iframe-height', id: '${frameId}', height: h }, '*');
          } catch(e){}
        }

        // Observadores: layout e mutações do widget
        var ro = new ResizeObserver(function(){ requestAnimationFrame(measure); });
        ro.observe(document.documentElement);
        if (document.body) ro.observe(document.body);
        if (ROOT) ro.observe(ROOT);

        var mo = new MutationObserver(function(){ requestAnimationFrame(measure); });
        if (ROOT) mo.observe(ROOT, { childList:true, subtree:true, attributes:true });

        // timers (pega mudanças assíncronas do SDK)
        var t1 = setInterval(measure, 120); // 2s mais críticos
        setTimeout(function(){ clearInterval(t1); }, 2000);
        var t2 = setInterval(measure, 500);
        setTimeout(function(){ clearInterval(t2); }, 12000);

        // remedir em resize de viewport do iframe
        window.addEventListener('resize', measure);

        // responder a “ping” do parent (quando o iframe for redimensionado externamente)
        window.addEventListener('message', function(e){
          if(e && e.data && e.data.type === 'distribusion-iframe-ping' && e.data.id === '${frameId}'){
            measure();
          }
        });

        function mount(){
          if (window.Distribusion && window.Distribusion.Search && typeof window.Distribusion.Search.mount === 'function') {
            window.Distribusion.Search.mount({
              root: ROOT,
              partnerNumber: ${partnerNum},
              locale: 'pt-BR',
              language: 'pt-BR',
              country: 'BR'
            });
            // medições escalonadas após o mount
            setTimeout(measure, 60);
            setTimeout(measure, 250);
            setTimeout(measure, 800);
            setTimeout(measure, 1600);
          }
        }

        if (document.readyState === 'complete') mount();
        else window.addEventListener('load', mount);

        // medição inicial
        measure();
      })();
    </script>
  </body>
</html>`.trim(),
    [partnerNum, frameId]
  );

  // recebe altura do iframe e aplica margem anti-corte
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (
        e?.data &&
        e.data.type === "distribusion-iframe-height" &&
        e.data.id === frameId &&
        typeof e.data.height === "number"
      ) {
        const newH = Math.max(200, Math.ceil(e.data.height + extraPadding));
        setIframeHeight((prev) => (Math.abs(prev - newH) > 2 ? newH : prev));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [frameId, extraPadding]);

  // quando a largura do iframe muda (responsivo), pedimos uma nova medição ao filho
  useEffect(() => {
    if (!iframeRef.current) return;
    const el = iframeRef.current;
    const ro = new ResizeObserver(() => {
      el.contentWindow?.postMessage({ type: "distribusion-iframe-ping", id: frameId }, "*");
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [frameId]);

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <iframe
        ref={iframeRef}
        title="Busca de ônibus — Distribusion"
        srcDoc={html}
        // importante: número vira px no inline style do React
        style={{ width: "100%", height: iframeHeight, border: 0, background: "transparent" }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
