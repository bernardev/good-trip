"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  partner?: string | number;   // default: env
  className?: string;
  /** Altura inicial provisória enquanto o widget monta */
  height?: number;
};

export default function DistribusionWidgetIframe({
  partner = process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER ?? "814999",
  className = "",
  height = 260,
}: Props) {
  // garante número e fallback seguro
  const partnerNum =
    Number(partner) ||
    Number(process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER) ||
    814999;

  // id único para canalizar mensagens deste iframe
  const frameId = useRef(`dist-${Math.random().toString(36).slice(2)}`).current;

  const [iframeHeight, setIframeHeight] = useState<number>(height);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // HTML injetado no iframe (memo para evitar recarregar a cada render)
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
      html,body{margin:0;padding:0;background:transparent}
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial}
      /* evita barras de rolagem internas; altura vem do parent */
      html,body{overflow:hidden}
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

        // função para enviar altura atual ao parent (mais robusta)
        function postHeight() {
          try {
            var rootBox = ROOT ? ROOT.getBoundingClientRect() : { height: 0, bottom: 0 };
            var hCandidates = [
              Math.ceil(rootBox.bottom),                         // fim visual do widget
              Math.ceil(rootBox.height),                         // altura do root
              document.documentElement.scrollHeight || 0,
              document.body ? document.body.scrollHeight : 0,
              document.documentElement.offsetHeight || 0,
              document.body ? document.body.offsetHeight : 0,
              document.documentElement.clientHeight || 0,
              document.body ? document.body.clientHeight : 0
            ];
            // margem anti-corte de 12px
            var h = Math.max.apply(Math, hCandidates) + 12;
            parent.postMessage({ type: 'distribusion-iframe-height', id: '${frameId}', height: h }, '*');
          } catch(e) { /* noop */ }
        }

        // Observa mudanças de layout e reporta
        var ro = new ResizeObserver(function(){ requestAnimationFrame(postHeight); });
        ro.observe(document.documentElement);
        if (document.body) ro.observe(document.body);
        if (ROOT) ro.observe(ROOT);

        // Observa mutações do DOM do widget (inputs/calendário abrindo, etc.)
        var mo = new MutationObserver(function(){ requestAnimationFrame(postHeight); });
        if (ROOT) mo.observe(ROOT, { childList: true, subtree: true, attributes: true });

        // remedir em resize do iframe/viewport
        window.addEventListener('resize', postHeight);

        // monta o widget em PT-BR
        function mountWidget(){
          if (window.Distribusion && window.Distribusion.Search && typeof window.Distribusion.Search.mount === 'function') {
            window.Distribusion.Search.mount({
              root: ROOT,
              partnerNumber: ${partnerNum},
              // Sinalizações de idioma/país (ignoradas se não suportadas)
              locale: 'pt-BR',
              language: 'pt-BR',
              country: 'BR'
            });
            // medições escalonadas após montar (captura expansões tardias)
            setTimeout(postHeight, 60);
            setTimeout(postHeight, 250);
            setTimeout(postHeight, 800);
            setTimeout(postHeight, 1600);
          }
        }

        // tenta montar quando a lib carregar
        if (document.readyState === 'complete') {
          mountWidget();
        } else {
          window.addEventListener('load', mountWidget);
        }

        // medida inicial
        postHeight();
      })();
    </script>
  </body>
</html>`.trim(),
    [partnerNum, frameId]
  );

  // Ouve mensagens de altura vindas do iframe
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (
        e?.data &&
        e.data.type === "distribusion-iframe-height" &&
        e.data.id === frameId &&
        typeof e.data.height === "number"
      ) {
        // altura mínima razoável
        const newH = Math.max(200, Math.ceil(e.data.height));
        setIframeHeight(newH);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [frameId]);

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <iframe
        ref={iframeRef}
        title="Busca de ônibus — Distribusion"
        srcDoc={html}
        style={{ width: "100%", height: iframeHeight, border: 0, background: "transparent" }}
        // precisa de same-origin + scripts para o auto-resize e o SDK
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
