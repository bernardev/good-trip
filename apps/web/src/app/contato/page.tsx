// apps/web/src/app/contato/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contato | Good Trip Passagens",
  description:
    "Fale com a Good Trip: dúvidas sobre passagens, alterações, cancelamentos e suporte. Estamos aqui para ajudar.",
};

export default function ContatoPage() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 pt-10 md:pt-14">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-accent text-ink font-semibold text-xs px-3 py-1 shadow">
            Atendimento
          </span>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-navy leading-tight">
            Fale com a Good Trip
          </h1>
          <p className="mt-3 text-ink/80">
            Dúvidas sobre sua passagem, reembolso, alteração ou suporte com a compra?
            Envie uma mensagem — respondemos o quanto antes.
          </p>
        </div>
      </section>

      {/* GRID */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 rounded-2xl border border-cloud bg-white p-5 sm:p-6 shadow-soft">
            <h2 className="text-xl md:text-2xl font-semibold text-navy">Envie sua mensagem</h2>
            <p className="mt-1 text-sm text-ink/70">
              Preencha os campos abaixo. Se já tiver um número de pedido, inclua na mensagem.
            </p>
            <div className="mt-4">
              <ContactForm />
            </div>
          </div>

          {/* Info lateral + IMAGEM */}
          <aside className="rounded-2xl border border-cloud bg-white p-5 sm:p-6 shadow-soft">
            {/* Imagem */}
            <div className="relative w-full aspect-[1/1] sm:aspect-[5/6] rounded-xl overflow-hidden border border-cloud/60">
              <Image
                src="/contato-good-trip.png" // coloque o arquivo em /public/contato-goodtrip.png
                alt="Atendimento Good Trip — canais de contato e horários"
                fill
                className="object-cover"
                sizes="(min-width:1024px) 28vw, 100vw"
                priority
              />
            </div>

            <h3 className="mt-5 font-semibold text-ink">Canais oficiais</h3>
            <ul className="mt-3 space-y-3 text-sm text-ink/80">
              <li>
                <span className="font-medium text-ink">E-mail: </span>
                <a href="mailto:comercial@goodtrip.com.br" className="text-primary hover:underline">
                  comercial@goodtrip.com.br
                </a>
              </li>
              <li>
                <span className="font-medium text-ink">WhatsApp: </span>
                <a
                  href="https://wa.me/5593991436570"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  (93) 99143-6570
                </a>
              </li>
              <li>
                <span className="font-medium text-ink">Horário: </span>
                Seg. a Sex., 08h–18h • Sáb., 08h–12h (Brasília)
              </li>
              <li>
                <span className="font-medium text-ink">Endereço: </span>
                Itaituba – PA, Brasil
              </li>
            </ul>

            <div className="mt-5 h-px bg-cloud" />

            <h4 className="mt-5 font-semibold text-ink">Atalhos úteis</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/quem-somos" className="text-primary hover:underline">
                  Quem Somos
                </Link>
              </li>
              <li>
                <a href="#buscar" className="text-primary hover:underline">
                  Comece sua busca agora
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/goodtrip.com.br"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  Siga no Instagram
                </a>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      {/* orbes decorativas */}
      <div aria-hidden className="absolute pointer-events-none -z-10 fx-orb fx-orb--gold w-72 h-72 -left-24 top-36 opacity-30" />
      <div aria-hidden className="absolute pointer-events-none -z-10 fx-orb fx-orb--blue w-80 h-80 -right-24 -bottom-16 opacity-30" />
    </main>
  );
}
