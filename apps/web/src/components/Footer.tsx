"use client";

import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { Exo_2 } from "next/font/google";
import type { SVGProps, JSX } from "react";

const exo2 = Exo_2({ subsets: ["latin"], weight: ["600", "700"] });

/** Ícones sólidos, simples e visíveis em qualquer tema */
function InstagramIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      {/* borda do app */}
      <path
        fill="currentColor"
        d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Z"
      />
      {/* ponto da câmera */}
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      {/* lente */}
      <path
        fill="currentColor"
        d="M12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 .001 5.001A2.5 2.5 0 0 0 12 9.5Z"
      />
    </svg>
  );
}

function WhatsAppIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      {/* bolha + círculo */}
      <path
        fill="currentColor"
        d="M20.52 3.5A10.22 10.22 0 0 0 2 22l1.7-.45A10.22 10.22 0 1 0 20.52 3.5ZM12 20.2a8.2 8.2 0 0 1-4.17-1.15l-.3-.17-2.47.65.66-2.4-.2-.31a8.2 8.2 0 1 1 6.48 3.38Z"
      />
      {/* “telefone” estilizado */}
      <path
        fill="currentColor"
        d="M16.74 14.4c-.26-.13-1.54-.76-1.78-.85s-.41-.13-.58.13-.66.85-.81 1.02-.3.2-.55.07a6.7 6.7 0 0 1-3.23-2.82c-.24-.41.24-.38.67-1.28.07-.14.03-.25-.02-.36-.06-.11-.58-1.39-.8-1.9-.21-.51-.42-.44-.58-.45h-.5c-.17 0-.45.07-.68.32s-.89.86-.89 2.1.91 2.45 1.04 2.62c.13.17 1.8 2.73 4.35 3.83.61.26 1.09.41 1.46.53.61.19 1.17.17 1.62.1.5-.08 1.54-.63 1.76-1.25.22-.62.22-1.15.15-1.26-.07-.11-.24-.18-.5-.31Z"
      />
    </svg>
  );
}

export default function Footer(): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-cloud bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-10 grid gap-10 md:grid-cols-5">
        {/* Brand */}
        <div className="col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/logo-goodtrip.jpeg"
              alt="GoodTrip"
              width={180}
              height={48}
              className="h-10 md:h-12 w-auto"
              priority
            />
            <span
              className={`${exo2.className} text-navy font-semibold tracking-tight`}
            >
              GoodTrip
            </span>
          </div>
          <p className="text-sm text-ink/70">
            Sua viagem completa em um só lugar: passagens, hospedagens,
            pacotes, aluguel de carros e eventos.
          </p>
        </div>

        {/* Institucional */}
        <div className="col-span-1">
          <h4 className={`${exo2.className} font-semibold text-ink mb-3`}>
            Institucional
          </h4>
          <ul className="space-y-2 text-sm text-ink/80">
            <li>
              <Link
                href="/sobre"
                className="hover:text-primary transition-colors"
              >
                Sobre
              </Link>
            </li>
            <li>
              <Link
                href="/termos"
                className="hover:text-primary transition-colors"
              >
                Termos de uso
              </Link>
            </li>
            <li>
              <Link
                href="/privacidade"
                className="hover:text-primary transition-colors"
              >
                Privacidade
              </Link>
            </li>
          </ul>
        </div>

        {/* Suporte */}
        <div className="col-span-1">
          <h4 className={`${exo2.className} font-semibold text-ink mb-3`}>
            Suporte
          </h4>
          <ul className="space-y-2 text-sm text-ink/80">
            <li>
              <Link
                href="/ajuda"
                className="hover:text-primary transition-colors"
              >
                Central de ajuda
              </Link>
            </li>
            <li>
              <Link
                href="/contato"
                className="hover:text-primary transition-colors"
              >
                Contato
              </Link>
            </li>
            <li>
              <Link
                href="/politicas"
                className="hover:text-primary transition-colors"
              >
                Políticas
              </Link>
            </li>
          </ul>
        </div>

        {/* Selo Reclame Aqui */}
        <div className="col-span-1">
          <h4 className={`${exo2.className} font-semibold text-ink mb-3`}>
            Reclame Aqui
          </h4>
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

        {/* Conecte-se + Compra segura + Cadastur */}
        <div className="col-span-1">
          <h4 className={`${exo2.className} font-semibold text-ink mb-3`}>
            Conecte-se
          </h4>

          {/* Ícones sociais — visíveis (text-ink) e com hover */}
          <div className="flex gap-2">
            <a
              href="https://www.instagram.com/goodtrip.com.br"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="h-10 w-10 grid place-items-center rounded-lg border border-cloud text-ink hover:bg-cloud/30 hover:text-primary transition"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>

            <a
              href="https://wa.me/5593991436570"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="h-10 w-10 grid place-items-center rounded-lg border border-cloud text-ink hover:bg-cloud/30 hover:text-primary transition"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          </div>

          {/* Compra 100% segura + Cadastur (logo abaixo da frase) */}
          <div className="mt-4">
            <p className="text-xs text-ink/70">Compra 100% segura</p>
            <div className="mt-2 flex items-center">
              <Image
                src="/cadastur.webp"
                alt="Cadastur"
                width={120}
                height={28}
                className="h-7 w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior com CNPJ + © + crédito */}
      <div className="border-t border-cloud">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 text-xs text-ink/70 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="order-2 md:order-1">
            © {year} GoodTrip. Todos os direitos reservados.
          </span>

          <span className="order-1 md:order-2">
            GOOD TRIP PASSAGENS LTDA – CNPJ: 57.355.709/0001-27
          </span>

          <span className="order-3 md:order-3">
            Desenvolvido por <span className="text-accent">EH CODE</span>.
          </span>
        </div>
      </div>
    </footer>
  );
}
