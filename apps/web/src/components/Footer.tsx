"use client";

import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { Exo_2 } from "next/font/google";

const exo2 = Exo_2({ subsets: ["latin"], weight: ["600", "700"] });

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-cloud bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-10 grid gap-10 md:grid-cols-5">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/logo-goodtrip.jpeg"
              alt="GoodTrip"
              width={180}
              height={48}
              className="h-10 md:h-12 w-auto"
              priority
            />
            <span className={`${exo2.className} text-navy font-semibold tracking-tight`}>
              GoodTrip
            </span>
          </div>
          <p className="text-sm text-ink/70">
            Sua viagem completa em um só lugar: passagens, hospedagens, pacotes,
            aluguel de carros e eventos.
          </p>
        </div>

        {/* Institucional */}
        <div>
          <h4 className={`${exo2.className} font-semibold text-ink mb-3`}>Institucional</h4>
          <ul className="space-y-2 text-sm text-ink/80">
            <li><Link href="/sobre" className="hover:text-primary transition-colors">Sobre</Link></li>
            <li><Link href="/termos" className="hover:text-primary transition-colors">Termos de uso</Link></li>
            <li><Link href="/privacidade" className="hover:text-primary transition-colors">Privacidade</Link></li>
          </ul>
        </div>

        {/* Suporte */}
        <div>
          <h4 className={`${exo2.className} font-semibold text-ink mb-3`}>Suporte</h4>
          <ul className="space-y-2 text-sm text-ink/80">
            <li><Link href="/ajuda" className="hover:text-primary transition-colors">Central de ajuda</Link></li>
            <li><Link href="/contato" className="hover:text-primary transition-colors">Contato</Link></li>
            <li><Link href="/politicas" className="hover:text-primary transition-colors">Políticas</Link></li>
          </ul>
        </div>

        {/* NOVA COLUNA — Selo Reclame Aqui */}
        <div>
          <h4 className={`${exo2.className} font-semibold text-ink mb-3`}>Reclame Aqui</h4>
          <div className="shrink-0">
            {/* reserva altura para não sumir antes do script montar */}
            <div id="reputation-ra" className="min-h-[84px]" />
            <Script
              id="ra-embed-reputation"
              src="https://s3.amazonaws.com/raichu-beta/selos/bundle.js"
              strategy="afterInteractive"
              data-id="WGhVUnZYd2o1U0hLUjBBeDpnb29kLXRyaXAtcGFzc2FnZW5zLWx0ZGE="
              data-target="reputation-ra"
              data-model="1"
            />
          </div>
        </div>

        {/* Conecte-se (permanece igual, com IG/WA + Cadastur) */}
        <div>
          <h4 className={`${exo2.className} font-semibold text-ink mb-3`}>Conecte-se</h4>

          {/* Ícones sociais */}
          <div className="flex gap-2">
            {/* Instagram */}
            <a
              href="https://instagram.com/seuperfil"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="h-10 w-10 grid place-items-center rounded-lg border border-cloud hover:bg-cloud/30 hover:text-primary transition"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.35 3.608 1.325.975.975 1.262 2.242 1.324 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.35 2.633-1.324 3.608-.975.975-2.242 1.262-3.608 1.324-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.35-3.608-1.324C2.567 19.566 2.28 18.299 2.218 16.933 2.16 15.667 2.148 15.287 2.148 12s.012-3.584.07-4.85c.062-1.366.35-2.633 1.325-3.608C4.518 1.583 5.785 1.296 7.151 1.234 8.417 1.176 8.797 1.163 12 1.163zm0 2.004c-3.157 0-3.529.012-4.773.07-1.027.047-1.584.218-1.953.364-.492.19-.842.417-1.21.785-.368.368-.595.718-.785 1.21-.146.369-.317.926-.364 1.953-.058 1.244-.07 1.616-.07 4.773s.012 3.529.07 4.773c.047 1.027.218 1.584.364 1.953.19.492.417.842.785 1.21.368.368.718.595 1.21.785.369.146.926.317 1.953.364 1.244.058 1.616.07 4.773.07s3.529-.012 4.773-.07z" />
              </svg>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/5593991436570"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="h-10 w-10 grid place-items-center rounded-lg border border-cloud hover:bg-cloud/30 hover:text-primary transition"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.672.15-.198.297-.77.967-.944 1.166-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.476-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.672-1.62-.92-2.222-.242-.582-.487-.503-.672-.512l-.571-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.71.306 1.264.489 1.696.626.712.227 1.36.195 1.872.118.571-.085 1.758-.718 2.006-1.412.248-.695.248-1.29.173-1.412-.074-.123-.272-.198-.57-.347M12.051 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.253 9.94 9.94 0 013.04-7.1 9.92 9.92 0 017.06-2.935h.004c2.652 0 5.146 1.035 7.02 2.913a9.86 9.86 0 012.935 7.032c-.002 5.487-4.47 9.956-9.92 9.956z" />
              </svg>
            </a>
          </div>

          {/* Compra Segura + Cadastur */}
          <div className="mt-4 flex items-center gap-3">

            <Image src="/cadastur.webp" alt="Cadastur" width={120} height={28} className="h-7 w-auto" />
          </div>
        </div>
      </div>

      <div className="border-t border-cloud">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 text-xs text-ink/70 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} GoodTrip. Todos os direitos reservados.</span>
          <span>
            Feito com <span className="text-accent">EH CODE</span>.
          </span>
        </div>
      </div>
    </footer>
  );
}
