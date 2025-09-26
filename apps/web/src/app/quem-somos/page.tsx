import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import SearchModalButton from "@/components/quem-somos/SearchModalButton";

export const metadata: Metadata = {
  title: "Sobre a Good Trip | Passagens Rodoviárias",
  description:
    "Saiba quem somos: mais de 12 anos embarcando brasileiros, 1 milhão+ de passageiros e 200+ viações. Compre sua passagem com segurança na Good Trip.",
};

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-cloud bg-white px-4 py-3 shadow-soft text-center">
      <div className="text-2xl font-extrabold text-navy">{v}</div>
      <div className="text-xs text-ink/60">{k}</div>
    </div>
  );
}

function Bullet({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-cloud bg-white p-4 shadow-soft">
      <div className="h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="mt-0.5 text-sm text-ink/70">{desc}</p>
      </div>
    </div>
  );
}

export default function SobrePage() {
  return (
    <main className="relative bg-white">
      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 pt-10 md:pt-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-block rounded-full bg-accent text-ink font-semibold text-xs px-3 py-1 shadow">
              Quem Somos
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-navy leading-tight">
              Good Trip Passagens — segurança e tranquilidade em cada viagem
            </h1>
            <p className="mt-3 text-ink/80">
              Há mais de <strong>12 anos</strong> no mercado de reservas rodoviárias, com sede em
              <strong> Itaituba–PA</strong>, já embarcamos <strong>1 milhão+</strong> de passageiros em todo o Brasil.
              Agora estamos ainda mais perto de você no nosso site, comparando horários e preços de
              <strong> 200+ viações</strong> em poucos cliques.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {/* abre o modal do SDK como no HowItWorks */}
              <SearchModalButton />
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-primary text-primary px-6 h-12 grid place-items-center font-semibold hover:bg-primary hover:text-white transition"
                aria-label="Abrir Instagram da Good Trip"
              >
                Siga no Instagram
              </a>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat k="Tempo de mercado" v="12+ anos" />
              <Stat k="Passageiros" v="1M+" />
              <Stat k="Viações" v="200+" />
              <Stat k="Sede" v="Itaituba–PA" />
            </div>
          </div>

          <div className="relative h-56 sm:h-72 md:h-80 rounded-2xl border border-cloud bg-white shadow-soft overflow-hidden">
            <Image src="/logo-goodtrip.jpeg" alt="Good Trip Passagens" fill className="object-contain p-6" priority />
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-2xl md:text-3xl font-semibold text-navy">Nossa missão</h2>
            <p className="mt-3 text-ink/80">
              Conectar você ao seu destino com rapidez, segurança e facilidade. Em nossa plataforma, é possível buscar,
              comparar e reservar passagens de ônibus com total confiança — <strong>a sua viagem começa aqui</strong>.
            </p>

            <h3 className="mt-8 text-xl font-semibold text-ink">Por que escolher a Good Trip?</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Bullet
                title="Compra segura"
                desc="Ambiente criptografado, múltiplos métodos de pagamento e confirmação rápida."
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 10V7a6 6 0 1 1 12 0v3" stroke="currentColor" strokeWidth="2" />
                    <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                  </svg>
                }
              />
              <Bullet
                title="Cobertura nacional"
                desc="Mais de 200 viações parceiras e rotas por todo o Brasil."
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  </svg>
                }
              />
              <Bullet
                title="Atendimento que resolve"
                desc="Suporte humano e próximo, antes e depois da compra."
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 22c4.97 0 9-4.03 9-9S16.97 4 12 4 3 8.03 3 13" stroke="currentColor" strokeWidth="2" />
                    <path d="M7 22v-3a4 4 0 0 1 4-4h3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                }
              />
              <Bullet
                title="Rápido e simples"
                desc="Busque, compare horários/preços e finalize em poucos cliques."
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 12h13M12 3l8 9-8 9" stroke="currentColor" strokeWidth="2" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Card lateral */}
          <aside className="rounded-2xl border border-cloud bg-white p-5 shadow-soft">
            <h3 className="font-semibold text-ink">Compre com confiança</h3>
            <p className="mt-1 text-sm text-ink/70">
              Reserve sua passagem rodoviária com quem entende do assunto. Centenas de rotas, tarifas competitivas e
              suporte de verdade.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-ink/80">
              <li>• Emissão rápida e envio por e-mail</li>
              <li>• Pagamento via Cartão, Pix ou boleto</li>
              <li>• Alterações e cancelamentos conforme regras da viação</li>
            </ul>

            {/* botão inline que abre o mesmo modal */}
            <div className="mt-5">
              <SearchModalButton />
            </div>
          </aside>
        </div>
      </section>

      {/* FAQ compacto */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 pb-14">
        <h2 className="text-xl md:text-2xl font-semibold text-navy">Perguntas rápidas</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <details className="rounded-xl border border-cloud bg-white p-4 shadow-soft">
            <summary className="cursor-pointer font-semibold text-ink">Posso comprar ida e volta?</summary>
            <p className="mt-2 text-sm text-ink/70">
              Sim. Na busca, selecione “Ida e volta”, escolha as datas e veja as melhores combinações.
            </p>
          </details>
          <details className="rounded-xl border border-cloud bg-white p-4 shadow-soft">
            <summary className="cursor-pointer font-semibold text-ink">Como recebo minha passagem?</summary>
            <p className="mt-2 text-sm text-ink/70">
              Você recebe tudo por e-mail. Embarque apresentando o ticket conforme instruções da viação.
            </p>
          </details>
          <details className="rounded-xl border border-cloud bg-white p-4 shadow-soft">
            <summary className="cursor-pointer font-semibold text-ink">Quais formas de pagamento?</summary>
            <p className="mt-2 text-sm text-ink/70">Cartão de crédito, Pix e boleto.</p>
          </details>
          <details className="rounded-xl border border-cloud bg-white p-4 shadow-soft">
            <summary className="cursor-pointer font-semibold text-ink">Atendem o Brasil todo?</summary>
            <p className="mt-2 text-sm text-ink/70">
              Sim! Trabalhamos com mais de 200 viações e rotas em todas as regiões do país.
            </p>
          </details>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <SearchModalButton />
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-primary text-primary px-6 h-12 grid place-items-center font-semibold hover:bg-primary hover:text-white transition"
          >
            Seguir no Instagram
          </a>
        </div>
      </section>

      {/* Orbes */}
      <div aria-hidden className="absolute pointer-events-none -z-10 fx-orb fx-orb--gold w-72 h-72 -left-24 top-28 opacity-30" />
      <div aria-hidden className="absolute pointer-events-none -z-10 fx-orb fx-orb--blue w-80 h-80 -right-24 -bottom-16 opacity-30" />
    </main>
  );
}
