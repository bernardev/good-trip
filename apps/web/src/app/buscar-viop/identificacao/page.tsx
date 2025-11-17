import IdentificacaoClient from "@/components/buscar/IdentificacaoClient";

export const dynamic = "force-dynamic";

type SearchParams = {
  servico?: string;
  origem?: string;
  destino?: string;
  data?: string;       // YYYY-MM-DD
  assentos?: string;   // "02,04"
  preco?: string;      // preço unitário (opcional)
  empresa?: string;    // opcional
  classe?: string;     // opcional
  saida?: string;      // HH:mm (opcional)
  chegada?: string;    // HH:mm (opcional)
};

type PageProps = { searchParams: Promise<SearchParams> };

export default async function IdentificacaoPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const servico = sp.servico ?? "";
  const origem  = sp.origem  ?? "";
  const destino = sp.destino ?? "";
  const data    = sp.data    ?? "";

  const assentos = (sp.assentos ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const hasMinParams = !!(servico && origem && destino && data);

  if (!hasMinParams) {
    return (
      <main className="container mx-auto max-w-3xl py-8">
        <h1 className="text-xl font-semibold mb-2">Identificação</h1>
        <p>Parâmetros incompletos. Volte à pré-compra e tente novamente.</p>
      </main>
    );
  }

  const meta: {
    preco?: number;
    empresa?: string;
    classe?: string;
    saida?: string;
    chegada?: string;
  } = {
    preco: sp.preco ? Number(sp.preco) : undefined,
    empresa: sp.empresa,
    classe: sp.classe,
    saida: sp.saida,
    chegada: sp.chegada,
  };

  return (
    <main className="container mx-auto max-w-4xl py-8">
      <h1 className="text-2xl font-semibold mb-6">Identificação do Passageiro</h1>
      <IdentificacaoClient
        query={{ servico, origem, destino, data, assentos }}
        meta={meta}
      />
    </main>
  );
}
