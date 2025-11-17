// apps/web/src/components/unified/DistribusionSlot.tsx
"use client";

import DistribusionWidgetIframe from "@/components/distribusion/DistribusionWidgetIframe";

export type Criteria = {
  origem: string;
  destino: string;
  data: string;      // YYYY-MM-DD
  pax: number;
  locale: string;    // pt-BR, en, ...
  currency: string;  // BRL, EUR, ...
  origemCode?: string;
  destinoCode?: string;
};

type Props = { criteria: Criteria };

/**
 * Slot da Distribusion dentro do nosso shell.
 * OBS: /result não pode ser iframado (CSP). Portanto, usamos o SDK/widget embutido.
 * No próximo passo, habilitamos pré-preenchimento e auto-busca a partir dos params.
 */
export default function DistribusionSlot({ criteria }: Props) {
  const partner = process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER ?? "814999";

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <DistribusionWidgetIframe
        partner={partner}
        className="w-full"
        // por enquanto só labels; no próximo passo faremos prefill+auto-search com data/pax
        defaultOrigin={{ lat: -25.4284, lng: -49.2733, label: criteria.origem }}
        defaultDestination={{ label: criteria.destino }}
      />
    </div>
  );
}
