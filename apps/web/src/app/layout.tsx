import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GoodTrip — sua viagem em um só lugar",
  description: "Passagens, hospedagens, pacotes, carros e eventos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.className} min-h-dvh antialiased bg-bg text-ink`}>
        <Header />
        <main className="min-h-[70dvh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
