"use client";

import { CSSProperties } from "react";

type E164Digits = `${number}`;
type ButtonSize = 48 | 56 | 64;

type Props = {
  phone?: E164Digits;                 // ex.: "5593991436570"
  ariaLabel?: string;                 // acessibilidade
  size?: ButtonSize;                  // 48 | 56 | 64
  floating?: boolean;                 // fixa no canto? (default true)
  className?: string;                 // classes extras
  offset?: { bottom?: number; right?: number }; // px
};

export default function WhatsAppButton({
  phone = "5593991436570",
  ariaLabel = "Fale no WhatsApp",
  size = 56,
  floating = true,
  className = "",
  offset = { bottom: 20, right: 20 },
}: Props) {
  const digits = (phone as string).replace(/[^\d]/g, "") as E164Digits;
  const href = `https://wa.me/${digits}`;

  const style: CSSProperties = {
    width: size,
    height: size,
    ...(floating && {
      position: "fixed",
      bottom: offset.bottom ?? 20,
      right: offset.right ?? 20,
      zIndex: 50,
    }),
    boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      style={style}
      className={[
        "flex items-center justify-center rounded-full bg-[#25D366] text-white",
        "hover:brightness-95 active:translate-y-[1px] transition will-change-transform",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2",
        className,
      ].join(" ")}
    >
      {/* WhatsApp brand (simple-icons path) - usa currentColor => branco */}
      <svg
        aria-hidden
        focusable="false"
        viewBox="0 0 24 24"
        width={Math.round(size * 0.52)}
        height={Math.round(size * 0.52)}
        className="shrink-0"
        style={{ display: "block" }}
      >
        <path
          fill="currentColor"
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.672.15-.198.297-.77.967-.944 1.166-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.476-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.672-1.62-.92-2.222-.242-.582-.487-.503-.672-.512l-.571-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.71.306 1.264.489 1.696.626.712.227 1.36.195 1.872.118.571-.085 1.758-.718 2.006-1.412.248-.695.248-1.29.173-1.412-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.253 9.94 9.94 0 013.04-7.1 9.92 9.92 0 017.06-2.935h.004c2.652 0 5.146 1.035 7.02 2.913a9.86 9.86 0 012.935 7.032c-.002 5.487-4.47 9.956-9.92 9.956m8.413-18.369A11.815 11.815 0 0012.05 0C5.495 0 .275 5.22.272 11.772c0 2.071.541 4.096 1.567 5.878L0 24l6.528-1.712a11.76 11.76 0 005.5 1.402h.005c6.554 0 11.773-5.22 11.776-11.773a11.73 11.73 0 00-3.345-8.371"
        />
      </svg>
    </a>
  );
}
