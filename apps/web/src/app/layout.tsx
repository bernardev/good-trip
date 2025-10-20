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
  title: "GoodTrip - seu destino começa aqui!",
  description: "+ de 200 empresas de ônibus em um só lugar!",
};

const GTM_ID = "GTM-TGXL5FVV";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full overflow-x-hidden">
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
        {/* End Google Tag Manager */}
        {/* Distribusion SDK assets */}
      </head>
      <body className={`${dmSans.className} min-h-dvh antialiased bg-bg text-ink overflow-x-hidden`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

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
