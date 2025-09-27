"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** caminho do vídeo em /public */
  src?: string;
  poster?: string;
  /** permitir ampliar além da resolução nativa? (default: false) */
  allowUpscale?: boolean;
  /** duração do fade de saída (ms) */
  fadeOutMs?: number;
};

export default function IntroVideoResponsive({
  src = "/video-intro.mp4",
  poster,
  allowUpscale = false,
  fadeOutMs = 400,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const recalc = () => {
    const v = videoRef.current;
    if (!v) return;
    const natW = v.videoWidth || 16;
    const natH = v.videoHeight || 9;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const scaleFit = Math.min(vw / natW, vh / natH);
    const scale = allowUpscale ? scaleFit : Math.min(scaleFit, 1);
    setSize({ w: Math.round(natW * scale), h: Math.round(natH * scale) });
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => {
      recalc();
      v.muted = true;
      v.playsInline = true;
      void v.play().catch(() => {/* se bloquear, usuário toca e inicia */});
    };

    const onEnded = () => {
      // congela no último frame e aplica fade
      setFading(true);
      window.setTimeout(() => setVisible(false), Math.max(0, fadeOutMs));
    };

    if (v.readyState >= 2) onLoaded();
    else v.addEventListener("loadedmetadata", onLoaded, { once: true });

    v.addEventListener("ended", onEnded);

    const onResize = () => recalc();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("ended", onEnded);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [allowUpscale, fadeOutMs]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[70] bg-white grid place-items-center transition-opacity`}
      style={{ opacity: fading ? 0 : 1, transitionDuration: `${fadeOutMs}ms` }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        playsInline
        preload="auto"
        controls={false}
        style={{
          width: size.w ? `${size.w}px` : "auto",
          height: size.h ? `${size.h}px` : "auto",
          display: "block",
        }}
      />
    </div>
  );
}
