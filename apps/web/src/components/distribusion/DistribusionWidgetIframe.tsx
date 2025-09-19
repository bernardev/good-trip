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
  const partnerNum: number =
    Number(partner) ||
    Number(process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER) ||
    814999;

  // id único p/ mensagens; só é definido após o mount (evita hydration diff)
  const frameIdRef = useRef<string>("");
  const [iframeHeight, setIframeHeight] = useState<number>(height);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // montado no cliente?
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => setMounted(true), []);

  // HTML do iframe — só é criado após mount para evitar mismatch SSR/CSR
  const html = useMemo<string>(() => {
    if (!mounted) return "";
    // gera id uma única vez no cliente
    if (!frameIdRef.current) {
      frameIdRef.current = `dist-${Math.random().toString(36).slice(2)}`;
    }
    const frameId = frameIdRef.current;

    return `
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

        function postHeight() {
          try {
            var h = Math.max(
              document.documentElement.scrollHeight || 0,
              document.body ? document.body.scrollHeight : 0
            );
            parent.postMessage({ type: 'distribusion-iframe-height', id: '${frameId}', height: h }, '*');
          } catch(e) { /* noop */ }
        }

        var ro = new ResizeObserver(function(){ requestAnimationFrame(postHeight); });
        ro.observe(document.documentElement);
        if (document.body) ro.observe(document.body);

        function mountWidget(){
          if (window.Distribusion && window.Distribusion.Search && typeof window.Distribusion.Search.mount === 'function') {
            window.Distribusion.Search.mount({
              root: ROOT,
              partnerNumber: ${partnerNum},
              locale: 'pt-BR',
              language: 'pt-BR',
              country: 'BR'
            });
            setTimeout(postHeight, 80);
            setTimeout(postHeight, 300);
          }
        }

        if (document.readyState === 'complete') {
          mountWidget();
        } else {
          window.addEventListener('load', mountWidget);
        }

        postHeight();
      })();
    </script>
  </body>
</html>`.trim();
  // depende apenas do mount e do partnerNum (ambos estáveis no cliente)
  }, [mounted, partnerNum]);

  // Ouve mensagens de altura vindas do iframe
  useEffect(() => {
    if (!mounted) return;

    function onMessage(e: MessageEvent) {
      const fid = frameIdRef.current;
      if (
        e?.data &&
        e.data.type === "distribusion-iframe-height" &&
        e.data.id === fid &&
        typeof e.data.height === "number"
      ) {
        const newH = Math.max(200, Math.ceil(e.data.height));
        setIframeHeight(newH);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [mounted]);

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      {mounted ? (
        <iframe
          ref={iframeRef}
          title="Busca de ônibus — Distribusion"
          srcDoc={html}
          style={{ width: "100%", height: iframeHeight, border: 0, background: "transparent" }}
          // precisa de same-origin + scripts para o auto-resize e o SDK
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      ) : (
        // placeholder opcional durante SSR/hidratação
        <div style={{ width: "100%", height, border: 0, background: "transparent" }} />
      )}
    </div>
  );
}
