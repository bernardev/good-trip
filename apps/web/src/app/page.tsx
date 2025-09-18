import Hero from "@/components/hero/Hero";
import OffersCarousel from "@/components/offers/OffersCarousel";
import AboutCallout from "@/components/about/AboutCallout";
import HowItWorks from "@/components/how/HowItWorks";
import PartnersMarquee from "@/components/partners/PartnersMarquee";
import DestinationsGrid from "@/components/destinations/DestinationsGrid";
import WhatsAppButton from "@/components/commom/WhatsAppButton";


export default function Page() {
  return (
    <>
      <Hero />
      <OffersCarousel />
      <HowItWorks />
      <PartnersMarquee />
      <AboutCallout />
      <DestinationsGrid />

      {/* Botão flutuante WhatsApp */}
      <div className="fixed right-4 bottom-4 z-50">
        <WhatsAppButton />
      </div>
    </>
  );
}
