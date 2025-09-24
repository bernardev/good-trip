// app/buscar/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import DistribusionWidgetIframe from "@/components/distribusion/DistribusionWidgetIframe"; 
// ↑ use exatamente o componente que você já tem (o do Shadow DOM sdk.1.0.0)

export default function BuscarPage() {
  const sp = useSearchParams();
  const destino = sp.get("destino"); // vem do card (slug ou nome)

  // Opcional: normalizar/mostrar nome bonito
  const destinoLabel = useMemo(() => {
    if (!destino) return null;
    // Se você usa slug nos cards, pode mapear aqui para o nome da cidade:
    const map: Record<string, string> = {
      "curitiba": "Curitiba",
      "florianopolis": "Florianópolis",
      "joinville": "Joinville",
      "sao-paulo": "São Paulo",
      "rio": "Rio de Janeiro",
      "porto-alegre": "Porto Alegre",
      "cascavel": "Cascavel",
      "londrina": "Londrina",
    };
    return map[destino] ?? destino;
  }, [destino]);

  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-14">
        <header className="mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-navy">
            {destinoLabel ? `Buscar horários — ${destinoLabel}` : "Buscar viagens"}
          </h1>
          <p className="text-ink/70 text-sm">
            Selecione origem e data. O destino já está definido pelo card.
          </p>
        </header>

        {/* Widget Distribusion igual ao do hero */}
        <div className="rounded-xl border border-cloud bg-white/70 p-3 sm:p-4 shadow-soft">
          <DistribusionWidgetIframe className="w-full" />
        </div>

        {/* Observação opcional p/ mobile */}
        <p className="mt-4 text-xs text-ink/60">
          Dica: no celular, role lateralmente caso o formulário apareça “apertado”.
        </p>
      </div>
    </section>
  );
}
