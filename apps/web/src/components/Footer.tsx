import Link from "next/link";
import Image from "next/image";
import { Exo_2 } from "next/font/google";

const exo2 = Exo_2({ subsets: ["latin"], weight: ["600", "700"] });

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-cloud bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-10 grid gap-10 md:grid-cols-4">
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
            <span className={`${exo2.className} text-navy font-semibold tracking-tight`}>GoodTrip</span>
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

        {/* Social */}
        <div>
          <h4 className={`${exo2.className} font-semibold text-ink mb-3`}>Conecte-se</h4>
          <div className="flex gap-2">
            <a href="#" aria-label="Instagram" className="h-10 w-10 grid place-items-center rounded-lg border border-cloud hover:bg-cloud/30 hover:text-primary transition">IG</a>
            <a href="#" aria-label="WhatsApp"  className="h-10 w-10 grid place-items-center rounded-lg border border-cloud hover:bg-cloud/30 hover:text-primary transition">WA</a>
            <a href="#" aria-label="LinkedIn"  className="h-10 w-10 grid place-items-center rounded-lg border border-cloud hover:bg-cloud/30 hover:text-primary transition">IN</a>
          </div>
        </div>
      </div>

      <div className="border-t border-cloud">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 text-xs text-ink/70 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} GoodTrip. Todos os direitos reservados.</span>
          <span>Feito com <span className="text-accent">EH CODE</span>.</span>
        </div>
      </div>
    </footer>
  );
}
