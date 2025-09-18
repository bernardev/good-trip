"use client";

type Props = {
  label?: string;
};

export default function WhatsAppButton({ label = "Fale no WhatsApp" }: Props) {
  // Número normalizado: 55 (BR) + 93 + 991436570
  const href = "https://wa.me/5593991436570";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[#25D366] text-white font-medium shadow-lg hover:brightness-95 active:translate-y-[1px] transition"
    >
      {/* ícone WhatsApp */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M27.5 16.3c0 6.3-5.2 11.4-11.6 11.4-2 0-3.9-.5-5.6-1.5L4.5 27l1.8-5.5a11.2 11.2 0 01-1.2-5.2C5.1 9.1 10.3 4 16.7 4c3.1 0 6 1.2 8.2 3.3a11.2 11.2 0 013.6 8.9z"
          fill="#25D366"
        />
        <path
          d="M12.6 9.6c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.7.1-1 .5s-1.4 1.4-1.4 3.5 1.4 4 1.6 4.3 2.7 4.3 6.5 5.9c3.2 1.3 3.9 1.1 4.6 1s2.3-1 2.6-1.9c.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.9-.6s-2.3-1.1-2.6-1.2-.6-.2-.9.2-1 1.2-1.2 1.5-.4.3-.8.1c-.4-.2-1.7-.6-3.3-2-1.2-1-2-2.3-2.2-2.7-.2-.4 0-.6.2-.8.2-.2.4-.5.5-.7.2-.2.2-.4.3-.6 0-.2 0-.5-.1-.7-.2-.2-.8-2.1-1.1-2.8z"
          fill="#fff"
        />
      </svg>
      <span>{label}</span>
    </a>
  );
}
