import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DM_Sans } from "next/font/google";
import IntroReveal from "@/components/IntroReveal";
import type { ReactNode } from "react";
import { Providers } from "../providers"; // ← usa SessionProvider

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GoodTrip — sua viagem em um só lugar",
  description: "Passagens, hospedagens, pacotes, carros e eventos.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full overflow-x-hidden">
      <head>{/* Distribusion SDK assets */}</head>
      <body className={`${dmSans.className} min-h-dvh antialiased bg-bg text-ink overflow-x-hidden`}>
        <Providers>
          <IntroReveal />
          <Header />
          <main className="min-h-[70dvh] w-full">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
